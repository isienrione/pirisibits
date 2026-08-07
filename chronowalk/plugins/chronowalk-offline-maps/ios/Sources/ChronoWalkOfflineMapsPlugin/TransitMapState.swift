import CoreLocation
import MapboxMaps
import UIKit

/// Payload for rendering a transit segment. React remains source of truth —
/// this struct only carries display geometry already resolved in JS.
struct TransitMapState {
    var cityId: String
    var routeCoordinates: [CLLocationCoordinate2D]
    var origin: CLLocationCoordinate2D?
    var destination: CLLocationCoordinate2D?
    var currentPosition: CLLocationCoordinate2D?
    var activeStopId: String?
    var destinationStopId: String?
    var showUserLocation: Bool

    static func from(jsObject object: JSObject) -> TransitMapState {
        let cityId = (object["cityId"] as? String)?.lowercased() ?? "rome"
        let routeCoordinates = parseRouteCoordinates(object["routeGeoJSON"])
        let origin = parseLatLng(object["origin"])
        let destination = parseLatLng(object["destination"])
        let currentPosition = parseLatLng(object["currentPosition"])
        let activeStopId = object["activeStopId"] as? String
        let destinationStopId = object["destinationStopId"] as? String
        let showUserLocation = (object["showUserLocation"] as? Bool) ?? (currentPosition != nil)

        return TransitMapState(
            cityId: cityId,
            routeCoordinates: routeCoordinates,
            origin: origin,
            destination: destination,
            currentPosition: currentPosition,
            activeStopId: activeStopId,
            destinationStopId: destinationStopId,
            showUserLocation: showUserLocation
        )
    }

    private static func parseLatLng(_ value: Any?) -> CLLocationCoordinate2D? {
        guard let dict = value as? JSObject else { return nil }
        let lat = doubleValue(dict["lat"]) ?? doubleValue(dict["latitude"])
        let lng = doubleValue(dict["lng"]) ?? doubleValue(dict["longitude"])
        guard let lat, let lng, (-90...90).contains(lat), (-180...180).contains(lng) else {
            return nil
        }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }

    private static func parseRouteCoordinates(_ value: Any?) -> [CLLocationCoordinate2D] {
        guard let geo = value as? JSObject else { return [] }

        // Accept LineString geometry or Feature wrapping LineString.
        let geometry: JSObject
        if let nested = geo["geometry"] as? JSObject {
            geometry = nested
        } else {
            geometry = geo
        }

        let type = (geometry["type"] as? String) ?? ""
        guard type == "LineString" else { return [] }
        guard let coords = geometry["coordinates"] as? [Any] else { return [] }

        return coords.compactMap { pair -> CLLocationCoordinate2D? in
            if let arr = pair as? [Any], arr.count >= 2,
               let lng = doubleValue(arr[0]), let lat = doubleValue(arr[1]) {
                return CLLocationCoordinate2D(latitude: lat, longitude: lng)
            }
            if let arr = pair as? [Double], arr.count >= 2 {
                return CLLocationCoordinate2D(latitude: arr[1], longitude: arr[0])
            }
            if let arr = pair as? [NSNumber], arr.count >= 2 {
                return CLLocationCoordinate2D(
                    latitude: arr[1].doubleValue,
                    longitude: arr[0].doubleValue
                )
            }
            return nil
        }
    }

    private static func doubleValue(_ value: Any?) -> Double? {
        if let d = value as? Double { return d }
        if let n = value as? NSNumber { return n.doubleValue }
        if let i = value as? Int { return Double(i) }
        if let s = value as? String { return Double(s) }
        return nil
    }
}

typealias JSObject = [String: Any]
