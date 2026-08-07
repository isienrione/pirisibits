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
        CAPPluginMethod(name: "openTestMap", returnType: CAPPluginReturnPromise)
    ]

    private let manager = OfflineMapRegionManager.shared

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
    /// Does not open TourMap / RedesignMapPage / Mapbox GL JS.
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

    private func normalizedCityId(from call: CAPPluginCall) -> String? {
        guard let raw = call.getString("cityId")?.trimmingCharacters(in: .whitespacesAndNewlines),
              !raw.isEmpty else {
            return nil
        }
        return raw.lowercased()
    }
}
