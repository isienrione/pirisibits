import CoreLocation
import Foundation
import MapboxMaps
import Turf

/// Centralized native offline-map region configuration.
/// Tune bounds / zoom here — do not silently expand areas at call sites.
enum OfflineMapRegionConfig {
    /// Style used for ChronoWalk offline packs (matches web offline Standard vector).
    /// Override at build time with `MAPBOX_STYLE_URI` if a production Studio style is ready.
    static let styleURIString: String = {
        if let override = Bundle.main.object(forInfoDictionaryKey: "CWMapboxStyleURI") as? String,
           !override.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
           !override.contains("$(") {
            return override
        }
        return "mapbox://styles/mapbox/standard"
    }()

    static var styleURI: StyleURI {
        StyleURI(rawValue: styleURIString) ?? .standard
    }

    /// Prefixed TileStore region id so ChronoWalk regions stay isolated.
    static func tileRegionId(forCityId cityId: String) -> String {
        "chronowalk-\(cityId)"
    }

    static func region(forCityId cityId: String) -> OfflineCityRegion? {
        switch cityId {
        case Rome.cityId:
            return Rome.region
        default:
            return nil
        }
    }

    struct OfflineCityRegion {
        let cityId: String
        let west: Double
        let south: Double
        let east: Double
        let north: Double
        let minZoom: UInt8
        let maxZoom: UInt8

        var tileRegionId: String {
            OfflineMapRegionConfig.tileRegionId(forCityId: cityId)
        }

        var zoomRange: ClosedRange<UInt8> {
            minZoom...maxZoom
        }

        var polygon: Polygon {
            let sw = CLLocationCoordinate2D(latitude: south, longitude: west)
            let se = CLLocationCoordinate2D(latitude: south, longitude: east)
            let ne = CLLocationCoordinate2D(latitude: north, longitude: east)
            let nw = CLLocationCoordinate2D(latitude: north, longitude: west)
            return Polygon([[sw, se, ne, nw, sw]])
        }
    }

    /// Prototype Rome walking bounds — do not silently expand.
    enum Rome {
        static let cityId = "rome"
        static let west = 12.44
        static let south = 41.86
        static let east = 12.53
        static let north = 41.93
        /// Conservative walking zoom range.
        static let minZoom: UInt8 = 11
        static let maxZoom: UInt8 = 16

        static var region: OfflineCityRegion {
            OfflineCityRegion(
                cityId: cityId,
                west: west,
                south: south,
                east: east,
                north: north,
                minZoom: minZoom,
                maxZoom: maxZoom
            )
        }
    }
}
