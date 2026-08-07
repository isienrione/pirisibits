import CoreLocation
import MapboxMaps
import UIKit

/// DEV-only full-screen native Mapbox map for offline Rome proof.
/// Uses the same TileStore / style as OfflineMapRegionManager — not Mapbox GL JS.
final class ChronoWalkOfflineMapViewController: UIViewController {
    private let cityId: String
    private let region: OfflineMapRegionConfig.OfflineCityRegion
    private var mapView: MapView?

    init(cityId: String, region: OfflineMapRegionConfig.OfflineCityRegion) {
        self.cityId = cityId
        self.region = region
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        // Prefer offline TileStore packs for this diagnostic map.
        OfflineMapRegionManager.shared.prepareMapboxMapsForOfflinePresentation()

        let center = CLLocationCoordinate2D(
            latitude: region.centerLatitude,
            longitude: region.centerLongitude
        )
        let camera = CameraOptions(center: center, zoom: region.initialZoom)
        let mapInitOptions = MapInitOptions(
            cameraOptions: camera,
            styleURI: OfflineMapRegionConfig.styleURI
        )

        let map = MapView(frame: view.bounds, mapInitOptions: mapInitOptions)
        map.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        map.ornaments.options.scaleBar.visibility = .hidden
        view.addSubview(map)
        mapView = map

        installCloseButton()
        installTitleLabel()
    }

    private func installCloseButton() {
        let button = UIButton(type: .system)
        button.setTitle("Close", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = UIColor(white: 0.12, alpha: 0.85)
        button.layer.cornerRadius = 10
        button.translatesAutoresizingMaskIntoConstraints = false
        button.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        button.accessibilityIdentifier = "offline-map-test-close"
        view.addSubview(button)

        NSLayoutConstraint.activate([
            button.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            button.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            button.heightAnchor.constraint(equalToConstant: 40),
            button.widthAnchor.constraint(greaterThanOrEqualToConstant: 88)
        ])
    }

    private func installTitleLabel() {
        let label = UILabel()
        label.text = "  Native Offline Map · \(cityId.capitalized)  "
        label.textColor = .white
        label.font = .systemFont(ofSize: 13, weight: .medium)
        label.backgroundColor = UIColor(white: 0.12, alpha: 0.75)
        label.layer.cornerRadius = 8
        label.clipsToBounds = true
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)

        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            label.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            label.heightAnchor.constraint(equalToConstant: 32)
        ])
    }

    @objc private func closeTapped() {
        dismiss(animated: true)
    }
}
