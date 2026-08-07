import Foundation
import Capacitor

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
        CAPPluginMethod(name: "deleteRegion", returnType: CAPPluginReturnPromise)
    ]

    private let manager = OfflineMapRegionManager.shared

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

    private func normalizedCityId(from call: CAPPluginCall) -> String? {
        guard let raw = call.getString("cityId")?.trimmingCharacters(in: .whitespacesAndNewlines),
              !raw.isEmpty else {
            return nil
        }
        return raw.lowercased()
    }
}
