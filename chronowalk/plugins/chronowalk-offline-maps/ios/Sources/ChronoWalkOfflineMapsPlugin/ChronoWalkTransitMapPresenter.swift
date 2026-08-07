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
        print("[NativeMap native] openTransitMap received cityId=\(state.cityId)")
        print("[NativeMap native] css frame \(Self.describe(frame))")
        print("[NativeMap native] host.view.bounds \(Self.describe(host.view.bounds))")
        if let webView {
            print("[NativeMap native] webView.bounds \(Self.describe(webView.bounds))")
            print("[NativeMap native] webView.frame \(Self.describe(webView.frame))")
        } else {
            print("[NativeMap native] webView missing")
        }

        try OfflineMapRegionManager.shared.ensureMapboxConfigured()
        OfflineMapRegionManager.shared.prepareMapboxMapsForOfflinePresentation()
        print("[NativeMap native] Mapbox configured; TileStore usage prepared")

        hostViewController = host
        self.webView = webView
        currentState = state

        let container: ChronoWalkTransitMapView
        if let existing = mapContainer {
            container = existing
            print("[NativeMap native] reusing MapView container")
        } else {
            container = ChronoWalkTransitMapView(frame: .zero)
            mapContainer = container
            attach(container, host: host, webView: webView)
            print("[NativeMap native] MapView container created and added to host")
        }

        let converted = convertFrame(frame, host: host, webView: webView)
        print("[NativeMap native] converted frame \(Self.describe(converted))")

        container.isHidden = false
        container.alpha = 1
        container.isUserInteractionEnabled = true
        container.frame = converted
        container.apply(state: state)
        raiseAboveWebView(container, host: host, webView: webView)

        print("[NativeMap native] container frame after layout \(Self.describe(container.frame))")
        print("[NativeMap native] container.isHidden=\(container.isHidden) alpha=\(container.alpha)")
        print("[NativeMap native] container.superviewIsHost=\(container.superview === host.view)")
        if let webView {
            let aboveWeb =
                host.view.subviews.firstIndex(of: container).flatMap { cIdx in
                    host.view.subviews.firstIndex(of: webView).map { cIdx > $0 }
                } ?? false
            print("[NativeMap native] container above webView=\(aboveWeb)")
        }

        return [
            "opened": true,
            "supported": true,
            "renderer": "mapbox-maps-ios",
            "styleURI": OfflineMapRegionConfig.styleURIString,
            "cityId": state.cityId,
            "frame": [
                "x": converted.origin.x,
                "y": converted.origin.y,
                "width": converted.size.width,
                "height": converted.size.height
            ] as [String: CGFloat],
            "hostBounds": [
                "width": host.view.bounds.width,
                "height": host.view.bounds.height
            ] as [String: CGFloat]
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
            let converted = convertFrame(frame, host: host, webView: webView)
            print("[NativeMap native] update css frame \(Self.describe(frame)) → \(Self.describe(converted))")
            container.frame = converted
        }
        container.isHidden = false
        container.alpha = 1
        container.apply(state: state)
        raiseAboveWebView(container, host: host, webView: webView)

        return [
            "updated": true,
            "supported": true,
            "renderer": "mapbox-maps-ios",
            "cityId": state.cityId,
            "frame": [
                "x": container.frame.origin.x,
                "y": container.frame.origin.y,
                "width": container.frame.size.width,
                "height": container.frame.size.height
            ] as [String: CGFloat]
        ]
    }

    func close() -> [String: Any] {
        print("[NativeMap native] closeTransitMap")
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
        print("[NativeMap native] setTransitMapVisible \(visible)")
        mapContainer?.isHidden = !visible
        if visible, let host = hostViewController, let container = mapContainer {
            raiseAboveWebView(container, host: host, webView: webView)
        }
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

    private func attach(_ container: UIView, host: UIViewController, webView: UIView?) {
        if let webView, webView.superview === host.view {
            host.view.insertSubview(container, aboveSubview: webView)
            print("[NativeMap native] MapView added above webView")
        } else if let webView, let parent = webView.superview, parent === host.view || host.view.subviews.contains(where: { $0 === parent || $0.subviews.contains(webView) }) {
            // Prefer the closest ancestor that is a direct child of host.view.
            if let directChild = host.view.subviews.first(where: { child in
                child === webView || child.subviews.contains(webView) || sequenceContainsWebView(child, webView)
            }) {
                host.view.insertSubview(container, aboveSubview: directChild)
                print("[NativeMap native] MapView added above webView ancestor")
            } else {
                host.view.addSubview(container)
                print("[NativeMap native] MapView added to host (fallback)")
            }
        } else {
            host.view.addSubview(container)
            print("[NativeMap native] MapView added to host")
        }
    }

    private func sequenceContainsWebView(_ root: UIView, _ webView: UIView) -> Bool {
        if root === webView { return true }
        for child in root.subviews {
            if sequenceContainsWebView(child, webView) { return true }
        }
        return false
    }

    private func raiseAboveWebView(_ container: UIView, host: UIViewController, webView: UIView?) {
        if let webView {
            if let directChild = host.view.subviews.first(where: { child in
                child === webView || sequenceContainsWebView(child, webView)
            }), directChild !== container {
                host.view.insertSubview(container, aboveSubview: directChild)
            }
        }
        host.view.bringSubviewToFront(container)
        print("[NativeMap native] bringSubviewToFront executed")
    }

    /// Convert CSS viewport rect from JS into host UIView coordinates.
    ///
    /// `getBoundingClientRect()` returns CSS pixels relative to the web viewport.
    /// In WKWebView these map 1:1 to UIKit points — do NOT multiply by screen.scale.
    /// Scroll is already reflected by getBoundingClientRect (viewport-relative).
    private func convertFrame(_ cssFrame: CGRect, host: UIViewController, webView: UIView?) -> CGRect {
        let css = CGRect(
            x: cssFrame.origin.x,
            y: cssFrame.origin.y,
            width: max(cssFrame.width, 1),
            height: max(cssFrame.height, 1)
        )

        guard let webView else {
            print("[NativeMap native] convertFrame without webView — using CSS rect as host points")
            return css
        }

        // Primary: treat CSS viewport coords as webView-local points, convert to host.
        let converted = webView.convert(css, to: host.view)

        // Cross-check: webView origin in host + CSS offset (should match when
        // webView.bounds.origin is .zero, the common Capacitor case).
        let webOriginInHost = webView.convert(CGPoint.zero, to: host.view)
        let additive = CGRect(
            x: webOriginInHost.x + css.origin.x,
            y: webOriginInHost.y + css.origin.y,
            width: css.width,
            height: css.height
        )

        let deltaX = abs(converted.origin.x - additive.origin.x)
        let deltaY = abs(converted.origin.y - additive.origin.y)
        print("[NativeMap native] convert check converted=\(Self.describe(converted)) additive=\(Self.describe(additive)) delta=(\(deltaX),\(deltaY))")

        // Prefer additive when convert diverges oddly (e.g. transformed scroll views).
        if deltaX > 1 || deltaY > 1 {
            print("[NativeMap native] using additive frame due to convert delta")
            return additive
        }
        return converted
    }

    private static func describe(_ rect: CGRect) -> String {
        String(
            format: "x=%.1f y=%.1f w=%.1f h=%.1f",
            rect.origin.x,
            rect.origin.y,
            rect.size.width,
            rect.size.height
        )
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
