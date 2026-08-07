import Foundation
import Capacitor
import UIKit

/// Capacitor bridge for ChronoWalk native offline maps (iOS only).
/// Does not initialize Mapbox on web — this class is compiled into the iOS app only.
@objc(ChronoWalkOfflineMapsPlugin)
public class ChronoWalkOfflineMapsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ChronoWalkOfflineMapsPlugin"
    public let jsName = "ChronoWalkOfflineMaps"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRegionStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "downloadRegion", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteRegion", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openTestMap", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openTransitMap", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTransitMap", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "closeTransitMap", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "recenterTransitMap", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setTransitMapVisible", returnType: CAPPluginReturnPromise)
    ]

    private let manager = OfflineMapRegionManager.shared
    private let transitPresenter = ChronoWalkTransitMapPresenter.shared

    public override func load() {
        super.load()
        manager.onProgress = { [weak self] payload in
            self?.notifyListeners("offlineMapProgress", data: payload)
        }
    }

    @objc public func isSupported(_ call: CAPPluginCall) {
        call.resolve([
            "supported": true,
            "platform": "ios"
        ])
    }

    @objc public func getRegionStatus(_ call: CAPPluginCall) {
        guard let cityId = normalizedCityId(from: call) else {
            call.reject(
                "cityId is required",
                OfflineMapErrorCode.downloadFailed.rawValue,
                nil,
                ["code": OfflineMapErrorCode.downloadFailed.rawValue]
            )
            return
        }

        manager.getRegionStatus(cityId: cityId) { result in
            DispatchQueue.main.async {
                switch result {
                case let .success(payload):
                    call.resolve(payload)
                case let .failure(error):
                    call.reject(
                        error.message,
                        error.code.rawValue,
                        nil,
                        error.bridgePayload
                    )
                }
            }
        }
    }

    @objc public func downloadRegion(_ call: CAPPluginCall) {
        guard let cityId = normalizedCityId(from: call) else {
            call.reject(
                "cityId is required",
                OfflineMapErrorCode.downloadFailed.rawValue,
                nil,
                ["code": OfflineMapErrorCode.downloadFailed.rawValue]
            )
            return
        }

        manager.downloadRegion(cityId: cityId) { result in
            DispatchQueue.main.async {
                switch result {
                case let .success(payload):
                    call.resolve(payload)
                case let .failure(error):
                    call.reject(
                        error.message,
                        error.code.rawValue,
                        nil,
                        error.bridgePayload
                    )
                }
            }
        }
    }

    @objc public func deleteRegion(_ call: CAPPluginCall) {
        guard let cityId = normalizedCityId(from: call) else {
            call.reject(
                "cityId is required",
                OfflineMapErrorCode.downloadFailed.rawValue,
                nil,
                ["code": OfflineMapErrorCode.downloadFailed.rawValue]
            )
            return
        }

        manager.deleteRegion(cityId: cityId) { result in
            DispatchQueue.main.async {
                switch result {
                case let .success(payload):
                    call.resolve(payload)
                case let .failure(error):
                    call.reject(
                        error.message,
                        error.code.rawValue,
                        nil,
                        error.bridgePayload
                    )
                }
            }
        }
    }

    /// Present a full-screen native Mapbox MapView for offline proof (DEV harness).
    @objc public func openTestMap(_ call: CAPPluginCall) {
        guard let cityId = normalizedCityId(from: call) else {
            call.reject(
                "cityId is required",
                OfflineMapErrorCode.downloadFailed.rawValue,
                nil,
                ["code": OfflineMapErrorCode.downloadFailed.rawValue]
            )
            return
        }

        guard let region = OfflineMapRegionConfig.region(forCityId: cityId) else {
            call.reject(
                "No offline map region configured for cityId=\(cityId)",
                OfflineMapErrorCode.unsupportedCity.rawValue,
                nil,
                ["code": OfflineMapErrorCode.unsupportedCity.rawValue]
            )
            return
        }

        do {
            try manager.ensureMapboxConfigured()
        } catch let error as OfflineMapError {
            call.reject(
                error.message,
                error.code.rawValue,
                nil,
                error.bridgePayload
            )
            return
        } catch {
            let normalized = OfflineMapError.normalize(error)
            call.reject(
                normalized.message,
                normalized.code.rawValue,
                nil,
                normalized.bridgePayload
            )
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else {
                call.reject(
                    "Plugin deallocated",
                    OfflineMapErrorCode.downloadFailed.rawValue,
                    nil,
                    ["code": OfflineMapErrorCode.downloadFailed.rawValue]
                )
                return
            }

            guard let host = self.bridge?.viewController else {
                call.reject(
                    "No host view controller available",
                    OfflineMapErrorCode.downloadFailed.rawValue,
                    nil,
                    ["code": OfflineMapErrorCode.downloadFailed.rawValue]
                )
                return
            }

            let mapVC = ChronoWalkOfflineMapViewController(cityId: cityId, region: region)
            host.present(mapVC, animated: true) {
                call.resolve([
                    "opened": true,
                    "cityId": cityId,
                    "supported": true,
                    "renderer": "mapbox-maps-ios",
                    "styleURI": OfflineMapRegionConfig.styleURIString
                ])
            }
        }
    }

    /// Embed a native transit MapView over the React map slot (iOS only).
    @objc public func openTransitMap(_ call: CAPPluginCall) {
        let jsObject = callOptionsDictionary(call)
        let state = TransitMapState.from(jsObject: jsObject)
        let frame = ChronoWalkTransitMapPresenter.parseFrame(from: call.getObject("frame"))
            ?? ChronoWalkTransitMapPresenter.parseFrame(from: jsObject["frame"] as? JSObject)

        guard let frame else {
            call.reject(
                "frame { x, y, width, height } is required",
                OfflineMapErrorCode.downloadFailed.rawValue,
                nil,
                ["code": OfflineMapErrorCode.downloadFailed.rawValue]
            )
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else {
                call.reject(
                    "Plugin deallocated",
                    OfflineMapErrorCode.downloadFailed.rawValue,
                    nil,
                    ["code": OfflineMapErrorCode.downloadFailed.rawValue]
                )
                return
            }
            guard let host = self.bridge?.viewController else {
                call.reject(
                    "No host view controller available",
                    OfflineMapErrorCode.downloadFailed.rawValue,
                    nil,
                    ["code": OfflineMapErrorCode.downloadFailed.rawValue]
                )
                return
            }

            do {
                let payload = try self.transitPresenter.open(
                    host: host,
                    webView: self.bridge?.webView,
                    frame: frame,
                    state: state
                )
                call.resolve(payload)
            } catch let error as OfflineMapError {
                call.reject(error.message, error.code.rawValue, nil, error.bridgePayload)
            } catch {
                let normalized = OfflineMapError.normalize(error)
                call.reject(normalized.message, normalized.code.rawValue, nil, normalized.bridgePayload)
            }
        }
    }

    @objc public func updateTransitMap(_ call: CAPPluginCall) {
        let jsObject = callOptionsDictionary(call)
        let state = TransitMapState.from(jsObject: jsObject)
        let frame = ChronoWalkTransitMapPresenter.parseFrame(from: call.getObject("frame"))
            ?? ChronoWalkTransitMapPresenter.parseFrame(from: jsObject["frame"] as? JSObject)

        DispatchQueue.main.async { [weak self] in
            guard let self else {
                call.reject(
                    "Plugin deallocated",
                    OfflineMapErrorCode.downloadFailed.rawValue,
                    nil,
                    ["code": OfflineMapErrorCode.downloadFailed.rawValue]
                )
                return
            }
            do {
                let payload = try self.transitPresenter.update(frame: frame, state: state)
                call.resolve(payload)
            } catch let error as OfflineMapError {
                // If update is called before open, attempt open when frame is present.
                if let frame, let host = self.bridge?.viewController {
                    do {
                        let payload = try self.transitPresenter.open(
                            host: host,
                            webView: self.bridge?.webView,
                            frame: frame,
                            state: state
                        )
                        call.resolve(payload)
                    } catch let openError as OfflineMapError {
                        call.reject(openError.message, openError.code.rawValue, nil, openError.bridgePayload)
                    } catch {
                        let normalized = OfflineMapError.normalize(error)
                        call.reject(normalized.message, normalized.code.rawValue, nil, normalized.bridgePayload)
                    }
                    return
                }
                call.reject(error.message, error.code.rawValue, nil, error.bridgePayload)
            } catch {
                let normalized = OfflineMapError.normalize(error)
                call.reject(normalized.message, normalized.code.rawValue, nil, normalized.bridgePayload)
            }
        }
    }

    @objc public func closeTransitMap(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            let payload = self?.transitPresenter.close() ?? ["closed": true, "supported": true]
            call.resolve(payload)
        }
    }

    @objc public func recenterTransitMap(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            let payload = self?.transitPresenter.recenter() ?? [
                "recentered": false,
                "supported": true
            ]
            call.resolve(payload)
        }
    }

    @objc public func setTransitMapVisible(_ call: CAPPluginCall) {
        let visible = call.getBool("visible") ?? true
        DispatchQueue.main.async { [weak self] in
            self?.transitPresenter.setVisible(visible)
            call.resolve(["visible": visible, "supported": true])
        }
    }

    private func normalizedCityId(from call: CAPPluginCall) -> String? {
        guard let raw = call.getString("cityId")?.trimmingCharacters(in: .whitespacesAndNewlines),
              !raw.isEmpty else {
            return nil
        }
        return raw.lowercased()
    }

    private func callOptionsDictionary(_ call: CAPPluginCall) -> JSObject {
        var object: JSObject = [:]
        if let options = call.options as? JSObject {
            object = options
        }
        // Capacitor may nest values; preserve known keys explicitly.
        if let cityId = call.getString("cityId") { object["cityId"] = cityId }
        if let route = call.getObject("routeGeoJSON") { object["routeGeoJSON"] = route }
        if let origin = call.getObject("origin") { object["origin"] = origin }
        if let destination = call.getObject("destination") { object["destination"] = destination }
        if let currentPosition = call.getObject("currentPosition") {
            object["currentPosition"] = currentPosition
        }
        if let activeStopId = call.getString("activeStopId") { object["activeStopId"] = activeStopId }
        if let destinationStopId = call.getString("destinationStopId") {
            object["destinationStopId"] = destinationStopId
        }
        if let showUserLocation = call.getBool("showUserLocation") {
            object["showUserLocation"] = showUserLocation
        }
        if let frame = call.getObject("frame") { object["frame"] = frame }
        return object
    }
}
