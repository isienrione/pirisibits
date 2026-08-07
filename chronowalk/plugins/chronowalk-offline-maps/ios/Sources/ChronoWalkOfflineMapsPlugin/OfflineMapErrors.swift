import Foundation
import MapboxMaps

/// Normalized error codes exposed to the JS bridge. Never surface raw native errors.
enum OfflineMapErrorCode: String {
    case networkUnavailable = "network_unavailable"
    case diskFull = "disk_full"
    case tileLimitExceeded = "tile_limit_exceeded"
    case mapboxNotConfigured = "mapbox_not_configured"
    case downloadFailed = "download_failed"
    case unsupportedCity = "unsupported_city"
    case alreadyDownloading = "already_downloading"
}

struct OfflineMapError: Error {
    let code: OfflineMapErrorCode
    let message: String

    var bridgePayload: [String: Any] {
        [
            "code": code.rawValue,
            "message": message
        ]
    }

    static func normalize(_ error: Error) -> OfflineMapError {
        if let known = error as? OfflineMapError {
            return known
        }

        if let tileError = error as? TileRegionError {
            switch tileError {
            case .canceled:
                return OfflineMapError(code: .downloadFailed, message: "Tile region download canceled")
            case .doesNotExist:
                return OfflineMapError(code: .downloadFailed, message: "Tile region does not exist")
            case .diskFull:
                return OfflineMapError(code: .diskFull, message: "Device storage is full")
            case .tileCountExceeded:
                return OfflineMapError(code: .tileLimitExceeded, message: "Mapbox tile pack limit exceeded")
            case .tilesetDescriptor, .other:
                return OfflineMapError(code: .downloadFailed, message: "Offline map download failed")
            }
        }

        if let styleError = error as? StylePackError {
            switch styleError {
            case .canceled:
                return OfflineMapError(code: .downloadFailed, message: "Style pack download canceled")
            case .diskFull:
                return OfflineMapError(code: .diskFull, message: "Device storage is full")
            case .doesNotExist, .other:
                return OfflineMapError(code: .downloadFailed, message: "Style pack download failed")
            }
        }

        let ns = error as NSError
        let combined = "\(ns.domain) \(ns.code) \(ns.localizedDescription) \(String(describing: error))".lowercased()

        if combined.contains("tilelimit") ||
            combined.contains("tile_limit") ||
            combined.contains("tilecountexceeded") ||
            combined.contains("tile count") {
            return OfflineMapError(
                code: .tileLimitExceeded,
                message: "Mapbox tile pack limit exceeded"
            )
        }

        if combined.contains("diskfull") ||
            combined.contains("disk_full") ||
            combined.contains("no space") ||
            combined.contains("not enough space") ||
            combined.contains("enospc") ||
            ns.code == NSFileWriteOutOfSpaceError {
            return OfflineMapError(
                code: .diskFull,
                message: "Device storage is full"
            )
        }

        if combined.contains("network") ||
            combined.contains("offline") ||
            combined.contains("not connected") ||
            combined.contains("internet") ||
            combined.contains("timed out") ||
            combined.contains("timeout") ||
            ns.domain == NSURLErrorDomain {
            return OfflineMapError(
                code: .networkUnavailable,
                message: "Network unavailable"
            )
        }

        if combined.contains("access token") ||
            combined.contains("not authorized") ||
            combined.contains("unauthorized") ||
            combined.contains("mbxaccesstoken") {
            return OfflineMapError(
                code: .mapboxNotConfigured,
                message: "Mapbox is not configured"
            )
        }

        return OfflineMapError(
            code: .downloadFailed,
            message: "Offline map download failed"
        )
    }
}
