import Foundation
import MapboxMaps

/// Owns Mapbox OfflineManager + TileStore access for ChronoWalk city regions.
/// Downloads style pack + tile region, reports progress, queries status, deletes
/// ChronoWalk regions only. Prevents duplicate simultaneous downloads.
final class OfflineMapRegionManager {
    static let shared = OfflineMapRegionManager()

    private let lock = NSLock()
    private lazy var offlineManager = OfflineManager()
    private lazy var tileStore = TileStore.default

    private var activeDownloads: [String: Cancelable] = [:]
    private var stylePackCancelable: Cancelable?
    private var progressByCity: [String: ProgressSnapshot] = [:]
    private var lastFailureByCity: [String: OfflineMapError] = [:]

    struct ProgressSnapshot {
        var completedResourceCount: UInt64
        var requiredResourceCount: UInt64

        var progress: Double? {
            guard requiredResourceCount > 0 else { return nil }
            return Double(completedResourceCount) / Double(requiredResourceCount)
        }
    }

    enum RegionStatus: String {
        case notDownloaded = "not_downloaded"
        case downloading
        case downloaded
        case failed
    }

    /// Optional progress sink for Capacitor `offlineMapProgress` events (DEV harness).
    var onProgress: (([String: Any]) -> Void)?

    private init() {}

    // MARK: - Configuration gate

    func ensureMapboxConfigured() throws {
        let token = resolvedAccessToken()
        guard !token.isEmpty else {
            throw OfflineMapError(
                code: .mapboxNotConfigured,
                message: "Mapbox public access token missing (MBXAccessToken)"
            )
        }
        // Prefer Info.plist / env token; Mapbox also reads MBXAccessToken automatically.
        if MapboxOptions.accessToken.isEmpty {
            MapboxOptions.accessToken = token
        }
    }

    /// Shared TileStore used for downloads and native MapView offline reads.
    var sharedTileStore: TileStore {
        tileStore
    }

    /// Point Mapbox Maps at the same TileStore used for region downloads.
    /// Call before presenting ChronoWalkOfflineMapViewController.
    func prepareMapboxMapsForOfflinePresentation() {
        do {
            try ensureMapboxConfigured()
        } catch {
            // Presenter still builds the view; openTestMap already gated on token.
        }
        MapboxMapsOptions.tileStore = tileStore
        // Prefer packs already in TileStore; fall back to network when online.
        MapboxMapsOptions.tileStoreUsageMode = .readOnly
    }

    private func resolvedAccessToken() -> String {
        if let plist = Bundle.main.object(forInfoDictionaryKey: "MBXAccessToken") as? String {
            let trimmed = plist.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty && !trimmed.hasPrefix("$(") && trimmed != "YOUR_MAPBOX_PUBLIC_TOKEN" {
                return trimmed
            }
        }
        if let env = ProcessInfo.processInfo.environment["MAPBOX_ACCESS_TOKEN"]?
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !env.isEmpty {
            return env
        }
        let current = MapboxOptions.accessToken.trimmingCharacters(in: .whitespacesAndNewlines)
        return current
    }

    // MARK: - Status

    func getRegionStatus(cityId: String, completion: @escaping (Result<[String: Any], OfflineMapError>) -> Void) {
        do {
            try ensureMapboxConfigured()
        } catch let error as OfflineMapError {
            completion(.failure(error))
            return
        } catch {
            completion(.failure(OfflineMapError.normalize(error)))
            return
        }

        guard let region = OfflineMapRegionConfig.region(forCityId: cityId) else {
            completion(.failure(OfflineMapError(
                code: .unsupportedCity,
                message: "No offline map region configured for cityId=\(cityId)"
            )))
            return
        }

        lock.lock()
        let downloading = activeDownloads[cityId] != nil
        let progress = progressByCity[cityId]
        let failure = lastFailureByCity[cityId]
        lock.unlock()

        if downloading {
            completion(.success(statusPayload(
                cityId: cityId,
                status: .downloading,
                progress: progress
            )))
            return
        }

        tileStore.tileRegion(forId: region.tileRegionId) { [weak self] result in
            guard let self else { return }
            switch result {
            case let .success(tileRegion):
                let snapshot = ProgressSnapshot(
                    completedResourceCount: tileRegion.completedResourceCount,
                    requiredResourceCount: tileRegion.requiredResourceCount
                )
                let complete = tileRegion.requiredResourceCount > 0
                    && tileRegion.completedResourceCount >= tileRegion.requiredResourceCount
                if complete {
                    self.lock.lock()
                    self.lastFailureByCity[cityId] = nil
                    self.lock.unlock()
                    completion(.success(self.statusPayload(
                        cityId: cityId,
                        status: .downloaded,
                        progress: snapshot
                    )))
                } else if let failure {
                    completion(.success(self.statusPayload(
                        cityId: cityId,
                        status: .failed,
                        progress: snapshot,
                        error: failure
                    )))
                } else {
                    // Partial region without an active download — treat as not fully downloaded.
                    completion(.success(self.statusPayload(
                        cityId: cityId,
                        status: .notDownloaded,
                        progress: snapshot
                    )))
                }
            case .failure:
                if let failure {
                    completion(.success(self.statusPayload(
                        cityId: cityId,
                        status: .failed,
                        progress: nil,
                        error: failure
                    )))
                } else {
                    completion(.success(self.statusPayload(
                        cityId: cityId,
                        status: .notDownloaded,
                        progress: nil
                    )))
                }
            }
        }
    }

    // MARK: - Download

    func downloadRegion(cityId: String, completion: @escaping (Result<[String: Any], OfflineMapError>) -> Void) {
        do {
            try ensureMapboxConfigured()
        } catch let error as OfflineMapError {
            completion(.failure(error))
            return
        } catch {
            completion(.failure(OfflineMapError.normalize(error)))
            return
        }

        guard let region = OfflineMapRegionConfig.region(forCityId: cityId) else {
            completion(.failure(OfflineMapError(
                code: .unsupportedCity,
                message: "No offline map region configured for cityId=\(cityId)"
            )))
            return
        }

        lock.lock()
        if activeDownloads[cityId] != nil {
            lock.unlock()
            completion(.failure(OfflineMapError(
                code: .alreadyDownloading,
                message: "A download is already in progress for \(cityId)"
            )))
            return
        }
        lastFailureByCity[cityId] = nil
        progressByCity[cityId] = ProgressSnapshot(completedResourceCount: 0, requiredResourceCount: 0)
        lock.unlock()

        downloadStylePackThenTiles(region: region, completion: completion)
    }

    private func downloadStylePackThenTiles(
        region: OfflineMapRegionConfig.OfflineCityRegion,
        completion: @escaping (Result<[String: Any], OfflineMapError>) -> Void
    ) {
        let styleURI = OfflineMapRegionConfig.styleURI
        guard let stylePackOptions = StylePackLoadOptions(
            glyphsRasterizationMode: .ideographsRasterizedLocally,
            metadata: [
                "chronowalk": true,
                "cityId": region.cityId,
                "kind": "style-pack"
            ],
            acceptExpired: true
        ) else {
            failDownload(cityId: region.cityId, error: OfflineMapError(
                code: .downloadFailed,
                message: "Could not create style pack options"
            ), completion: completion)
            return
        }

        let styleCancelable = offlineManager.loadStylePack(
            for: styleURI,
            loadOptions: stylePackOptions
        ) { [weak self] progress in
            guard let self else { return }
            let snapshot = ProgressSnapshot(
                completedResourceCount: progress.completedResourceCount,
                requiredResourceCount: max(progress.requiredResourceCount, 1)
            )
            self.lock.lock()
            self.progressByCity[region.cityId] = snapshot
            self.lock.unlock()
            self.emitProgress(cityId: region.cityId, status: .downloading, progress: snapshot)
        } completion: { [weak self] result in
            guard let self else { return }
            switch result {
            case .success:
                self.loadTileRegion(region: region, completion: completion)
            case let .failure(error):
                self.failDownload(
                    cityId: region.cityId,
                    error: OfflineMapError.normalize(error),
                    completion: completion
                )
            }
        }

        lock.lock()
        stylePackCancelable = styleCancelable
        // Placeholder so concurrent downloadRegion calls are rejected while style pack runs.
        activeDownloads[region.cityId] = styleCancelable
        lock.unlock()
    }

    private func loadTileRegion(
        region: OfflineMapRegionConfig.OfflineCityRegion,
        completion: @escaping (Result<[String: Any], OfflineMapError>) -> Void
    ) {
        let styleURI = OfflineMapRegionConfig.styleURI
        let descriptorOptions = TilesetDescriptorOptions(
            styleURI: styleURI,
            zoomRange: region.zoomRange,
            tilesets: nil
        )
        let descriptor = offlineManager.createTilesetDescriptor(for: descriptorOptions)

        guard let loadOptions = TileRegionLoadOptions(
            geometry: .polygon(region.polygon),
            descriptors: [descriptor],
            metadata: [
                "chronowalk": true,
                "cityId": region.cityId,
                "west": region.west,
                "south": region.south,
                "east": region.east,
                "north": region.north,
                "minZoom": Int(region.minZoom),
                "maxZoom": Int(region.maxZoom)
            ],
            acceptExpired: true
        ) else {
            failDownload(cityId: region.cityId, error: OfflineMapError(
                code: .downloadFailed,
                message: "Could not create tile region load options"
            ), completion: completion)
            return
        }

        let cancelable = tileStore.loadTileRegion(
            forId: region.tileRegionId,
            loadOptions: loadOptions
        ) { [weak self] progress in
            guard let self else { return }
            let snapshot = ProgressSnapshot(
                completedResourceCount: progress.completedResourceCount,
                requiredResourceCount: progress.requiredResourceCount
            )
            self.lock.lock()
            self.progressByCity[region.cityId] = snapshot
            self.lock.unlock()
            self.emitProgress(cityId: region.cityId, status: .downloading, progress: snapshot)
        } completion: { [weak self] result in
            guard let self else { return }
            self.clearActiveDownload(cityId: region.cityId)

            switch result {
            case let .success(tileRegion):
                let snapshot = ProgressSnapshot(
                    completedResourceCount: tileRegion.completedResourceCount,
                    requiredResourceCount: tileRegion.requiredResourceCount
                )
                self.lock.lock()
                self.progressByCity[region.cityId] = snapshot
                self.lastFailureByCity[region.cityId] = nil
                self.lock.unlock()
                self.emitProgress(cityId: region.cityId, status: .downloaded, progress: snapshot)
                completion(.success(self.statusPayload(
                    cityId: region.cityId,
                    status: .downloaded,
                    progress: snapshot
                )))
            case let .failure(error):
                let normalized = OfflineMapError.normalize(error)
                self.lock.lock()
                self.lastFailureByCity[region.cityId] = normalized
                self.lock.unlock()
                self.emitProgress(cityId: region.cityId, status: .failed, progress: nil, error: normalized)
                completion(.failure(normalized))
            }
        }

        lock.lock()
        activeDownloads[region.cityId] = cancelable
        lock.unlock()
    }

    // MARK: - Delete

    func deleteRegion(cityId: String, completion: @escaping (Result<[String: Any], OfflineMapError>) -> Void) {
        do {
            try ensureMapboxConfigured()
        } catch let error as OfflineMapError {
            completion(.failure(error))
            return
        } catch {
            completion(.failure(OfflineMapError.normalize(error)))
            return
        }

        guard let region = OfflineMapRegionConfig.region(forCityId: cityId) else {
            completion(.failure(OfflineMapError(
                code: .unsupportedCity,
                message: "No offline map region configured for cityId=\(cityId)"
            )))
            return
        }

        lock.lock()
        if let active = activeDownloads[cityId] {
            active.cancel()
            activeDownloads[cityId] = nil
        }
        stylePackCancelable?.cancel()
        stylePackCancelable = nil
        progressByCity[cityId] = nil
        lastFailureByCity[cityId] = nil
        lock.unlock()

        // Remove only the ChronoWalk tile region for this city — not unrelated Mapbox data.
        // TileStore is the source of truth (not JS localStorage). Subsequent getRegionStatus
        // queries TileStore again after app / WebView restart.
        tileStore.removeRegion(forId: region.tileRegionId) { [weak self] result in
            guard let self else { return }
            switch result {
            case .success:
                completion(.success(self.statusPayload(
                    cityId: cityId,
                    status: .notDownloaded,
                    progress: nil
                )))
            case let .failure(error):
                if let tileError = error as? TileRegionError, case .doesNotExist = tileError {
                    completion(.success(self.statusPayload(
                        cityId: cityId,
                        status: .notDownloaded,
                        progress: nil
                    )))
                    return
                }
                completion(.failure(OfflineMapError.normalize(error)))
            }
        }
    }

    // MARK: - Helpers

    private func failDownload(
        cityId: String,
        error: OfflineMapError,
        completion: @escaping (Result<[String: Any], OfflineMapError>) -> Void
    ) {
        clearActiveDownload(cityId: cityId)
        lock.lock()
        lastFailureByCity[cityId] = error
        lock.unlock()
        completion(.failure(error))
    }

    private func clearActiveDownload(cityId: String) {
        lock.lock()
        activeDownloads[cityId] = nil
        stylePackCancelable = nil
        lock.unlock()
    }

    private func emitProgress(
        cityId: String,
        status: RegionStatus,
        progress: ProgressSnapshot?,
        error: OfflineMapError? = nil
    ) {
        let payload = statusPayload(
            cityId: cityId,
            status: status,
            progress: progress,
            error: error
        )
        DispatchQueue.main.async { [weak self] in
            self?.onProgress?(payload)
        }
    }

    private func statusPayload(
        cityId: String,
        status: RegionStatus,
        progress: ProgressSnapshot?,
        error: OfflineMapError? = nil
    ) -> [String: Any] {
        var payload: [String: Any] = [
            "cityId": cityId,
            "status": status.rawValue,
            "supported": true
        ]

        if let progress {
            if let value = progress.progress {
                payload["progress"] = value
            } else {
                payload["progress"] = NSNull()
            }
            payload["completedResourceCount"] = progress.completedResourceCount
            payload["requiredResourceCount"] = progress.requiredResourceCount
        } else {
            payload["progress"] = NSNull()
            payload["completedResourceCount"] = NSNull()
            payload["requiredResourceCount"] = NSNull()
        }

        if let error {
            payload["errorCode"] = error.code.rawValue
            payload["errorMessage"] = error.message
        }

        return payload
    }
}
