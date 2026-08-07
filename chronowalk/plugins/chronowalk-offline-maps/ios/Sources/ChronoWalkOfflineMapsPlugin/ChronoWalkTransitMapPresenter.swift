import UIKit

/// Owns the embedded transit MapView overlay above the Capacitor WebView.
/// React measures the map slot; this presenter positions the native view to match.
final class ChronoWalkTransitMapPresenter {
    static let shared = ChronoWalkTransitMapPresenter()

    private weak var hostViewController: UIViewController?
    private weak var webView: UIView?
    private var mapContainer: ChronoWalkTransitMapView?
    private var currentState: TransitMapState?

    private init() {}

    @discardableResult
    func open(
        host: UIViewController,
        webView: UIView?,
        frame: CGRect,
        state: TransitMapState
    ) throws -> [String: Any] {
        try OfflineMapRegionManager.shared.ensureMapboxConfigured()
        OfflineMapRegionManager.shared.prepareMapboxMapsForOfflinePresentation()

        hostViewController = host
        self.webView = webView
        currentState = state

        let container: ChronoWalkTransitMapView
        if let existing = mapContainer {
            container = existing
        } else {
            container = ChronoWalkTransitMapView(frame: .zero)
            mapContainer = container
            host.view.addSubview(container)
        }

        container.isHidden = false
        container.frame = convertFrame(frame, host: host, webView: webView)
        container.apply(state: state)
        host.view.bringSubviewToFront(container)

        return [
            "opened": true,
            "supported": true,
            "renderer": "mapbox-maps-ios",
            "styleURI": OfflineMapRegionConfig.styleURIString,
            "cityId": state.cityId
        ]
    }

    @discardableResult
    func update(frame: CGRect?, state: TransitMapState) throws -> [String: Any] {
        guard let host = hostViewController, let container = mapContainer else {
            throw OfflineMapError(
                code: .downloadFailed,
                message: "Transit map is not open"
            )
        }

        currentState = state
        if let frame {
            container.frame = convertFrame(frame, host: host, webView: webView)
        }
        container.isHidden = false
        container.apply(state: state)
        host.view.bringSubviewToFront(container)

        return [
            "updated": true,
            "supported": true,
            "renderer": "mapbox-maps-ios",
            "cityId": state.cityId
        ]
    }

    func close() -> [String: Any] {
        mapContainer?.removeFromSuperview()
        mapContainer = nil
        currentState = nil
        hostViewController = nil
        webView = nil
        return [
            "closed": true,
            "supported": true
        ]
    }

    func setVisible(_ visible: Bool) {
        mapContainer?.isHidden = !visible
    }

    func recenter() -> [String: Any] {
        guard mapContainer != nil else {
            return [
                "recentered": false,
                "supported": true,
                "errorCode": OfflineMapErrorCode.downloadFailed.rawValue
            ]
        }
        mapContainer?.recenter()
        return [
            "recentered": true,
            "supported": true
        ]
    }

    /// Convert CSS viewport rect from JS into host UIView coordinates.
    private func convertFrame(_ cssFrame: CGRect, host: UIViewController, webView: UIView?) -> CGRect {
        guard let webView else {
            return cssFrame
        }

        // getBoundingClientRect is relative to the visual viewport.
        // Map into the webView's bounds, then into the host view.
        let inWebView = CGRect(
            x: cssFrame.origin.x,
            y: cssFrame.origin.y,
            width: max(cssFrame.width, 1),
            height: max(cssFrame.height, 1)
        )
        return webView.convert(inWebView, to: host.view)
    }
}

extension ChronoWalkTransitMapPresenter {
    static func parseFrame(from object: JSObject?) -> CGRect? {
        guard let object else { return nil }
        let x = doubleValue(object["x"]) ?? doubleValue(object["left"])
        let y = doubleValue(object["y"]) ?? doubleValue(object["top"])
        let width = doubleValue(object["width"])
        let height = doubleValue(object["height"])
        guard let x, let y, let width, let height, width > 0, height > 0 else {
            return nil
        }
        return CGRect(x: x, y: y, width: width, height: height)
    }

    private static func doubleValue(_ value: Any?) -> Double? {
        if let d = value as? Double { return d }
        if let n = value as? NSNumber { return n.doubleValue }
        if let i = value as? Int { return Double(i) }
        if let s = value as? String { return Double(s) }
        return nil
    }
}
