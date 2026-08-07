import CoreLocation
import MapboxMaps
import UIKit

/// Embedded native Mapbox transit map (streets + route + waypoints + location).
/// Uses the same TileStore as OfflineMapRegionManager — never Mapbox GL JS.
final class ChronoWalkTransitMapView: UIView {
    private var mapView: MapView?
    private var polylineManager: PolylineAnnotationManager?
    private var circleManager: CircleAnnotationManager?
    private var state = TransitMapState(
        cityId: "rome",
        routeCoordinates: [],
        origin: nil,
        destination: nil,
        currentPosition: nil,
        activeStopId: nil,
        destinationStopId: nil,
        showUserLocation: false
    )
    private var styleLoaded = false
    private var cancelables = Set<AnyCancelable>()

    private lazy var recenterButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Recenter", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 13, weight: .semibold)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = UIColor(white: 0.12, alpha: 0.88)
        button.layer.cornerRadius = 10
        button.translatesAutoresizingMaskIntoConstraints = false
        button.accessibilityIdentifier = "native-transit-map-recenter"
        button.addTarget(self, action: #selector(recenterTapped), for: .touchUpInside)
        return button
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(white: 0.08, alpha: 1)
        clipsToBounds = true
        accessibilityIdentifier = "native-transit-map-view"
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        cancelables.removeAll()
    }

    func installMapIfNeeded() {
        guard mapView == nil else { return }

        OfflineMapRegionManager.shared.prepareMapboxMapsForOfflinePresentation()

        let camera = CameraOptions(
            center: CLLocationCoordinate2D(
                latitude: OfflineMapRegionConfig.Rome.region.centerLatitude,
                longitude: OfflineMapRegionConfig.Rome.region.centerLongitude
            ),
            zoom: 14
        )
        let options = MapInitOptions(
            cameraOptions: camera,
            styleURI: OfflineMapRegionConfig.styleURI
        )
        let map = MapView(frame: bounds, mapInitOptions: options)
        map.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        map.ornaments.options.scaleBar.visibility = .hidden
        map.ornaments.options.compass.visibility = .hidden
        insertSubview(map, at: 0)
        mapView = map

        polylineManager = map.annotations.makePolylineAnnotationManager(
            id: "chronowalk-transit-route"
        )
        circleManager = map.annotations.makeCircleAnnotationManager(
            id: "chronowalk-transit-waypoints"
        )

        map.mapboxMap.onStyleLoaded.observeNext { [weak self] _ in
            self?.styleLoaded = true
            self?.applyAnnotations()
            self?.fitCamera(animated: false)
        }.store(in: &cancelables)

        addSubview(recenterButton)
        NSLayoutConstraint.activate([
            recenterButton.trailingAnchor.constraint(equalTo: safeAreaLayoutGuide.trailingAnchor, constant: -12),
            recenterButton.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -12),
            recenterButton.heightAnchor.constraint(equalToConstant: 36),
            recenterButton.widthAnchor.constraint(greaterThanOrEqualToConstant: 88)
        ])
    }

    func apply(state: TransitMapState) {
        self.state = state
        installMapIfNeeded()
        configureLocationPuck()
        if styleLoaded {
            applyAnnotations()
            fitCamera(animated: true)
        }
    }

    func recenter() {
        fitCamera(animated: true)
    }

    @objc private func recenterTapped() {
        recenter()
    }

    private func configureLocationPuck() {
        guard let mapView else { return }
        if state.showUserLocation, state.currentPosition != nil {
            mapView.location.options.puckType = .puck2D()
            mapView.location.options.puckBearingEnabled = false
        } else {
            mapView.location.options.puckType = nil
        }
    }

    private func applyAnnotations() {
        guard let polylineManager, let circleManager else { return }

        if state.routeCoordinates.count >= 2 {
            var line = PolylineAnnotation(lineCoordinates: state.routeCoordinates)
            line.lineColor = StyleColor(UIColor(red: 0.85, green: 0.62, blue: 0.22, alpha: 1))
            line.lineWidth = 4.5
            line.lineJoin = .round
            polylineManager.annotations = [line]
        } else {
            polylineManager.annotations = []
        }

        var circles: [CircleAnnotation] = []

        if let origin = state.origin {
            var circle = CircleAnnotation(centerCoordinate: origin)
            circle.circleRadius = 7
            circle.circleColor = StyleColor(UIColor(white: 0.95, alpha: 1))
            circle.circleStrokeColor = StyleColor(UIColor(white: 0.15, alpha: 1))
            circle.circleStrokeWidth = 2
            circles.append(circle)
        }

        if let destination = state.destination {
            var circle = CircleAnnotation(centerCoordinate: destination)
            // Emphasize next destination.
            circle.circleRadius = 11
            circle.circleColor = StyleColor(UIColor(red: 0.90, green: 0.45, blue: 0.18, alpha: 1))
            circle.circleStrokeColor = StyleColor(.white)
            circle.circleStrokeWidth = 3
            circles.append(circle)
        }

        // Explicit user marker when Mapbox location puck has no live GPS fix yet
        // but React supplied a currentPosition (e.g. last known / simulated).
        if state.showUserLocation, let user = state.currentPosition {
            var circle = CircleAnnotation(centerCoordinate: user)
            circle.circleRadius = 6
            circle.circleColor = StyleColor(UIColor(red: 0.20, green: 0.55, blue: 0.95, alpha: 1))
            circle.circleStrokeColor = StyleColor(.white)
            circle.circleStrokeWidth = 2
            circles.append(circle)
        }

        circleManager.annotations = circles
    }

    func fitCamera(animated: Bool) {
        guard let mapView else { return }

        var coordinates = state.routeCoordinates
        if let origin = state.origin { coordinates.append(origin) }
        if let destination = state.destination { coordinates.append(destination) }
        if let user = state.currentPosition { coordinates.append(user) }

        // Deduplicate roughly.
        coordinates = coordinates.reduce(into: [CLLocationCoordinate2D]()) { result, coord in
            if result.contains(where: {
                abs($0.latitude - coord.latitude) < 0.00001 &&
                    abs($0.longitude - coord.longitude) < 0.00001
            }) {
                return
            }
            result.append(coord)
        }

        guard !coordinates.isEmpty else { return }

        let padding = UIEdgeInsets(top: 48, left: 40, bottom: 56, right: 40)

        if coordinates.count == 1 {
            let camera = CameraOptions(center: coordinates[0], padding: padding, zoom: 14.5)
            if animated {
                mapView.camera.ease(to: camera, duration: 0.45)
            } else {
                mapView.mapboxMap.setCamera(to: camera)
            }
            return
        }

        let camera = mapView.mapboxMap.camera(
            for: coordinates,
            padding: padding,
            bearing: nil,
            pitch: nil
        )
        if animated {
            mapView.camera.ease(to: camera, duration: 0.45)
        } else {
            mapView.mapboxMap.setCamera(to: camera)
        }
    }
}
