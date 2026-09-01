#!/usr/bin/env python3
"""
Seed the Santiago physical-graph IDENTITY corpus (Gate 1B.1).

Identity only: names, kinds, neighborhoods, geocode queries.
NO coordinates. NO arithmetic fallbacks. NO Mapbox calls.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "src" / "data" / "santiago"

# Product POIs already in src/data/pois.ts — legacy mapping targets.
LEGACY_PRODUCT = {
    "la-moneda": "La Moneda",
    "morande-80": "Morandé 80",
    "londres-38": "Londres 38",
    "plaza-de-armas": "Plaza de Armas",
    "pasaje-phillips": "Pasaje Phillips",
    "catedral": "Catedral Metropolitana de Santiago",
    "merced": "Basílica de la Merced Santiago",
    "santa-lucia": "Cerro Santa Lucía",
    "lastarria": "Barrio Lastarria Santiago",
    "parque-forestal": "Parque Forestal Santiago",
    "gam": "Centro Cultural Gabriela Mistral GAM",
    "bellavista": "Barrio Bellavista Santiago",
    "la-chascona": "La Chascona Museo Neruda",
    "san-cristobal": "Cerro San Cristóbal Santiago",
    "mercado-central": "Mercado Central de Santiago",
    "museo-memoria": "Museo de la Memoria y los Derechos Humanos",
    "yungay": "Barrio Yungay Santiago",
    "barrio-brasil": "Barrio Brasil Santiago",
    "barrio-italia": "Barrio Italia Santiago",
    "san-francisco": "Iglesia de San Francisco Santiago Chile",
    "palacio-pereira": "Palacio Pereira Santiago",
}

# Additional launch slots (not yet in product runtime).
EXTRA_LAUNCH = {
    "ex-congreso": ("Ex Congreso Nacional", "civic", "Centro Cívico", "Ex Congreso Nacional Santiago Chile"),
    "plaza-constitucion": ("Plaza de la Constitución", "civic", "Centro Cívico", "Plaza de la Constitución Santiago"),
    "museo-bellas-artes": ("Museo Nacional de Bellas Artes", "museum", "Parque Forestal", "Museo Nacional de Bellas Artes Santiago"),
    "estacion-mapocho": ("Estación Mapocho", "architecture", "Mapocho", "Estación Mapocho Centro Cultural"),
    "cementerio-general": ("Cementerio General", "memory", "Recoleta", "Cementerio General de Santiago"),
    "plaza-nunoa": ("Plaza Ñuñoa", "plaza", "Ñuñoa", "Plaza Ñuñoa Santiago Chile"),
    "villa-grimaldi": ("Villa Grimaldi", "memory", "Peñalolén", "Parque por la Paz Villa Grimaldi"),
    "teatro-municipal": ("Teatro Municipal", "culture", "Santiago Centro", "Teatro Municipal de Santiago"),
    "casa-de-los-diez": ("Casa de los Diez", "architecture", "Lastarria", "Casa de los Diez Santiago Lastarria"),
}

# Broader identity set to reach 103 canonical nodes (queries only).
EXTENDED = [
    ("palacio-de-la-moneda-patio", "Patio de Los Naranjos La Moneda", "micro", "Centro Cívico", "Patio de los Naranjos Palacio de La Moneda"),
    ("plaza-bulnes", "Plaza Bulnes", "plaza", "Centro Cívico", "Plaza Bulnes Santiago"),
    ("iglesia-de-san-agustin", "Iglesia de San Agustín", "micro", "Santiago Centro", "Iglesia de San Agustín Santiago Chile"),
    ("iglesia-de-santo-domingo", "Iglesia de Santo Domingo", "micro", "Santiago Centro", "Iglesia de Santo Domingo Santiago"),
    ("iglesia-de-san-saturnino", "Iglesia de San Saturnino", "micro", "Yungay", "Iglesia de San Saturnino Yungay"),
    ("plaza-brasil", "Plaza Brasil", "plaza", "Brasil", "Plaza Brasil Santiago"),
    ("plaza-yungay", "Plaza Yungay", "plaza", "Yungay", "Plaza Yungay Santiago"),
    ("biblioteca-nacional", "Biblioteca Nacional", "civic", "Alameda", "Biblioteca Nacional de Chile"),
    ("universidad-de-chile-casa-central", "Casa Central Universidad de Chile", "architecture", "Alameda", "Casa Central Universidad de Chile"),
    ("universidad-catolica-casa-central", "Casa Central Universidad Católica", "architecture", "Alameda", "Casa Central Pontificia Universidad Católica de Chile"),
    ("plaza-italia", "Plaza Baquedano", "plaza", "Providencia", "Plaza Baquedano Santiago"),
    ("providencia-manuel-montt", "Barrio Manuel Montt", "barrio", "Providencia", "Manuel Montt Providencia Santiago"),
    ("parque-bustamante", "Parque Bustamante", "nature", "Providencia", "Parque Bustamante Santiago"),
    ("costanera-center", "Costanera Center", "architecture", "Providencia", "Costanera Center Santiago"),
    ("sky-costanera", "Sky Costanera", "viewpoint", "Providencia", "Sky Costanera Santiago"),
    ("barrio-patronato", "Barrio Patronato", "barrio", "Recoleta", "Barrio Patronato Santiago"),
    ("vega-central", "La Vega Central", "market", "Recoleta", "La Vega Central Santiago"),
    ("patio-bellavista", "Patio Bellavista", "pocket", "Bellavista", "Patio Bellavista Santiago"),
    ("zoologico-nacional", "Zoológico Nacional", "nature", "San Cristóbal", "Zoológico Nacional de Chile"),
    ("piscina-tupahue", "Piscina Tupahue", "nature", "San Cristóbal", "Piscina Tupahue Parque Metropolitano"),
    ("casa-museo-la-sebastiana", "La Sebastiana", "museum", "Valparaíso-ref", "La Sebastiana Valparaíso"),  # flagged remote — identity only
    ("museo-historico-nacional", "Museo Histórico Nacional", "museum", "Plaza de Armas", "Museo Histórico Nacional Santiago"),
    ("correo-central", "Correo Central", "architecture", "Plaza de Armas", "Correo Central Santiago Plaza de Armas"),
    ("municipalidad-santiago", "Municipalidad de Santiago", "civic", "Plaza de Armas", "Municipalidad de Santiago Plaza de Armas"),
    ("paseo-ahuada", "Paseo Ahumada", "micro", "Santiago Centro", "Paseo Ahumada Santiago"),
    ("paseo-estado", "Paseo Estado", "micro", "Santiago Centro", "Paseo Estado Santiago"),
    ("paseo-huérfanos", "Paseo Huérfanos", "micro", "Santiago Centro", "Paseo Huérfanos Santiago"),
    ("bolsa-de-comercio", "Bolsa de Comercio", "architecture", "Santiago Centro", "Bolsa de Comercio de Santiago"),
    ("club-de-la-union", "Club de la Unión", "architecture", "Alameda", "Club de la Unión Santiago"),
    ("cerro-blanco", "Cerro Blanco", "viewpoint", "Recoleta", "Cerro Blanco Santiago"),
    ("parque-ohiggins", "Parque O'Higgins", "nature", "Santiago", "Parque O'Higgins Santiago"),
    ("estadio-nacional", "Estadio Nacional", "memory", "Ñuñoa", "Estadio Nacional Julio Martínez Prádanos"),
    ("movistar-arena", "Movistar Arena", "culture", "Ñuñoa", "Movistar Arena Santiago"),
    ("barrio-republica", "Barrio República", "barrio", "República", "Barrio República Santiago"),
    ("parque-almagro", "Parque Almagro", "nature", "Santiago Centro", "Parque Almagro Santiago"),
    ("iglesia-de-los-sacramentinos", "Los Sacramentinos", "architecture", "Almagro", "Basílica de los Sacramentinos Santiago"),
    ("museo-arte-contemporaneo", "Museo de Arte Contemporáneo", "museum", "Parque Forestal", "Museo de Arte Contemporáneo Santiago Parque Forestal"),
    ("castillo-hidalgo", "Castillo Hidalgo", "architecture", "Santa Lucía", "Castillo Hidalgo Cerro Santa Lucía"),
    ("fuente-neptuno", "Fuente de Neptuno", "micro", "Santa Lucía", "Fuente de Neptuno Cerro Santa Lucía"),
    ("terraza-caupolican", "Terraza Caupolicán", "viewpoint", "Santa Lucía", "Terraza Caupolicán Cerro Santa Lucía"),
    ("plaza-mulato-gil", "Plaza Mulato Gil de Castro", "plaza", "Lastarria", "Plaza Mulato Gil de Castro"),
    ("museo-artes-visuales", "Museo de Artes Visuales", "museum", "Lastarria", "Museo de Artes Visuales MAVI Santiago"),
    ("iglesia-de-la-vera-cruz", "Iglesia de la Vera Cruz", "micro", "Lastarria", "Iglesia de la Vera Cruz Lastarria"),
    ("constitucion-203", "Constitución 203", "micro", "Lastarria", "Calle Constitución 203 Santiago"),
    ("embajada-espana-memory", "Sitio Embajada de España 1973", "memory", "Providencia", "Avenida Providencia Embajada de España Santiago"),
    ("london-38-plaque", "Placa Londres 38", "micro", "París-Londres", "Londres 38 Santiago placa"),
    ("jose-domingo-canas-1367", "José Domingo Cañas 1367", "memory", "Ñuñoa", "José Domingo Cañas 1367 Santiago"),
    ("casa-memoria-jose-domingo-canas", "Casa Memoria José Domingo Cañas", "memory", "Ñuñoa", "Casa Memoria José Domingo Cañas"),
    ("parque-por-la-paz-entrada", "Entrada Parque por la Paz", "micro", "Peñalolén", "Parque por la Paz Villa Grimaldi entrada"),
    ("puente-los-carros", "Puente de los Carros", "micro", "Mapocho", "Puente de los Carros Santiago"),
    ("puente-cal-y-canto", "Puente Cal y Canto", "architecture", "Mapocho", "Puente Cal y Canto Santiago"),
    ("mercado-cardonal", "Mercado Cardonal", "market", "Valparaíso-ref", "Mercado Cardonal Valparaíso"),
    ("barrio-paris-londres", "Barrio París-Londres", "barrio", "París-Londres", "Barrio París Londres Santiago"),
    ("iglesia-de-las-agustinas", "Iglesia de las Agustinas", "micro", "Santiago Centro", "Iglesia de las Agustinas Santiago"),
    ("palacio-cousino", "Palacio Cousiño", "architecture", "Santiago Centro", "Palacio Cousiño Santiago"),
    ("museo-precolombino", "Museo Chileno de Arte Precolombino", "museum", "Santiago Centro", "Museo Chileno de Arte Precolombino"),
    ("plaza-de-la-ciudadania", "Plaza de la Ciudadanía", "plaza", "Centro Cívico", "Plaza de la Ciudadanía Santiago"),
    ("centro-cultural-palacio-moneda", "Centro Cultural La Moneda", "culture", "Centro Cívico", "Centro Cultural Palacio de La Moneda"),
    ("paseo-bandera", "Paseo Bandera", "micro", "Santiago Centro", "Paseo Bandera Santiago"),
    ("edificio-empire", "Edificio Empire", "architecture", "Santiago Centro", "Edificio Empire Santiago Chile"),
    ("torre-entel", "Torre Entel", "architecture", "Santiago Centro", "Torre Entel Santiago"),
    ("plaza-vicuna", "Plaza Vicuña Mackenna", "plaza", "Alameda", "Plaza Vicuña Mackenna Santiago"),
    ("universidad-de-santiago", "Universidad de Santiago", "civic", "Estación Central", "Universidad de Santiago de Chile"),
    ("estacion-central", "Estación Central", "architecture", "Estación Central", "Estación Central de Santiago"),
    ("barrio-meiggs", "Barrio Meiggs", "barrio", "Estación Central", "Barrio Meiggs Santiago"),
    ("parque-quinta-normal", "Parque Quinta Normal", "nature", "Quinta Normal", "Parque Quinta Normal Santiago"),
    ("museo-nacional-historia-natural", "Museo Nacional de Historia Natural", "museum", "Quinta Normal", "Museo Nacional de Historia Natural Santiago"),
    ("artequin", "Museo Artequin", "museum", "Quinta Normal", "Museo Artequin Santiago"),
    ("matucana-100", "Matucana 100", "culture", "Quinta Normal", "Matucana 100 Santiago"),
    ("biblioteca-de-santiago", "Biblioteca de Santiago", "civic", "Quinta Normal", "Biblioteca de Santiago Matucana"),
    ("plaza-los-heroes", "Plaza Los Héroes", "plaza", "Santiago Centro", "Plaza Los Héroes Santiago Chile"),
    ("iglesia-de-san-isidro", "Iglesia de San Isidro", "micro", "San Isidro", "Iglesia de San Isidro Labrador Santiago"),
    ("barrio-bellas-artes", "Barrio Bellas Artes", "barrio", "Lastarria", "Barrio Bellas Artes Santiago"),
    ("constanza", "Calle Constitución Bellavista", "micro", "Bellavista", "Calle Constitución Bellavista Santiago"),
    ("pio-nodo", "Pío Nono", "micro", "Bellavista", "Pío Nono Santiago Bellavista"),
    ("universidad-de-chile-bellavista", "Campus Providencia / Bellavista edge", "micro", "Bellavista", "Universidad de Chile Bellavista Santiago"),
    ("cerro-san-cristobal-cumbre", "Cumbre Virgen San Cristóbal", "viewpoint", "San Cristóbal", "Virgen de la Inmaculada Concepción Cerro San Cristóbal"),
    ("funicular-san-cristobal", "Funicular de Santiago", "micro", "San Cristóbal", "Funicular de Santiago Cerro San Cristóbal"),
    ("teleferico-santiago", "Teleférico de Santiago", "micro", "San Cristóbal", "Teleférico Santiago Parque Metropolitano"),
    ("parque-metropolitano-entrada-pio-nono", "Entrada Parque Metropolitano Pío Nono", "micro", "Bellavista", "Entrada Parque Metropolitano Pío Nono"),
    ("casa-museo-isla-negra-ref", "Isla Negra (ref)", "museum", "remote-ref", "Casa Museo Isla Negra Neruda"),
    ("concha-y-toro", "Viña Concha y Toro", "remote-ref", "Pirque", "Viña Concha y Toro Pirque"),
    ("cajon-del-maipo-ref", "Cajón del Maipo (ref)", "nature", "remote-ref", "Cajón del Maipo Santiago"),
    ("maipu-templo-votive", "Templo Votivo de Maipú", "architecture", "Maipú", "Templo Votivo de Maipú"),
    ("plaza-de-maipu", "Plaza de Maipú", "plaza", "Maipú", "Plaza de Armas de Maipú"),
    ("barrio-franklin", "Barrio Franklin / Persa Bio Bio", "market", "Franklin", "Barrio Franklin Santiago Persa"),
    ("persa-bio-bio", "Persa Bío Bío", "market", "Franklin", "Persa Bio Bio Santiago Chile"),
    ("club-hipico", "Club Hípico", "nature", "Santiago", "Club Hípico de Santiago"),
    ("parque-araucano", "Parque Araucano", "nature", "Las Condes", "Parque Araucano Santiago"),
    ("apoquindo", "Avenida Apoquindo", "barrio", "Las Condes", "Avenida Apoquindo Las Condes"),
    ("sanhattan", "Sanhattan", "architecture", "Las Condes", "Sanhattan Santiago financial district"),
    ("isidora-goyenechea", "Isidora Goyenechea", "barrio", "Las Condes", "Isidora Goyenechea Santiago"),
    ("parque-arauco", "Parque Arauco", "architecture", "Las Condes", "Mall Parque Arauco Santiago"),
    ("cerro-calan", "Cerro Calán", "viewpoint", "Las Condes", "Cerro Calán Observatorio Santiago"),
]


def node(id_: str, name: str, kind: str, neighborhood: str, query: str, *, launch: bool, legacy: str | None):
    return {
        "id": id_,
        "name": name,
        "kind": kind,
        "neighborhood": neighborhood,
        "geocodeQuery": query,
        "launchCorpus": launch,
        "legacyContentId": legacy,
        "coordinateStatus": "UNGEOCODED",
        "selectionStatus": "PENDING_GEOCODE",
        "physicalState": "IDENTITY_ONLY",
        # Explicit: no coordinates at identity stage
        "lat": None,
        "lng": None,
        "provider": None,
        "candidates": [],
        "provenance": {
            "source": "gate-1b1-identity-seed",
            "coordinatePolicy": "mapbox-only-no-arithmetic-fallback",
            "curatorApproval": "never-automatic",
        },
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    nodes = []
    seen = set()

    for nid, title in LEGACY_PRODUCT.items():
        kind = "anchor" if nid in {"la-moneda", "plaza-de-armas", "santa-lucia", "san-cristobal"} else (
            "pocket" if nid in {"morande-80", "londres-38", "lastarria", "gam", "bellavista", "museo-memoria", "barrio-italia"} else "micro"
        )
        neighborhood = {
            "la-moneda": "Centro Cívico",
            "morande-80": "Centro Cívico",
            "londres-38": "París-Londres",
            "plaza-de-armas": "Santiago Centro",
            "pasaje-phillips": "Santiago Centro",
            "catedral": "Plaza de Armas",
            "merced": "Merced",
            "santa-lucia": "Santa Lucía",
            "lastarria": "Lastarria",
            "parque-forestal": "Forestal",
            "gam": "Lastarria",
            "bellavista": "Bellavista",
            "la-chascona": "Bellavista",
            "san-cristobal": "Parque Metropolitano",
            "mercado-central": "Mercado",
            "museo-memoria": "Matucana",
            "yungay": "Yungay",
            "barrio-brasil": "Brasil",
            "barrio-italia": "Italia",
            "san-francisco": "Alameda",
            "palacio-pereira": "Barrio Cívico",
        }[nid]
        nodes.append(node(nid, title.split(" Santiago")[0], kind, neighborhood, f"{title} Santiago Chile" if "Santiago" not in title else title, launch=True, legacy=nid))
        seen.add(nid)

    for nid, (name, kind, neighborhood, query) in EXTRA_LAUNCH.items():
        nodes.append(node(nid, name, kind, neighborhood, query, launch=True, legacy=None))
        seen.add(nid)

    for row in EXTENDED:
        nid, name, kind, neighborhood, query = row
        nid = nid.replace(" ", "-")
        if nid in seen:
            continue
        nodes.append(node(nid, name, kind, neighborhood, query, launch=False, legacy=None))
        seen.add(nid)
        if len(nodes) >= 103:
            break

    # Pad carefully with additional centro micro-identities if under 103
    pad = [
        ("galeria-imperial", "Galería Imperial", "micro", "Santiago Centro", "Galería Imperial Santiago Centro"),
        ("galeria-jubae", "Galería Jubaé", "micro", "Santiago Centro", "Galería Jubaé Santiago"),
        ("cafe-haití-ahumada", "Café Haití Ahumada", "micro", "Santiago Centro", "Café Haití Paseo Ahumada Santiago"),
        ("confiteria-torres", "Confitería Torres", "micro", "Alameda", "Confitería Torres Santiago"),
        ("bar-the-clinic", "Bar The Clinic / memoria periodística", "micro", "Lastarria", "Lastarria Santiago barrio periodístico"),
        ("plaza-de-armas-fuente", "Fuente Plaza de Armas", "micro", "Plaza de Armas", "Fuente Plaza de Armas Santiago"),
        ("catedral-sagrario", "Sagrario Metropolitano", "micro", "Plaza de Armas", "Sagrario Metropolitano Santiago"),
        ("museo-de-santiago-casa-colorada", "Casa Colorada", "museum", "Santiago Centro", "Casa Colorada Museo de Santiago"),
        ("iglesia-de-san-francisco-claustro", "Claustro San Francisco", "micro", "Alameda", "Claustro Museo Colonial San Francisco Santiago"),
        ("barrio-civico-relocks", "Eje Cívico Bulnes", "micro", "Centro Cívico", "Eje Bulnes Santiago"),
        ("defensa-street-memory", "Calle Dieciocho memory edge", "micro", "República", "Calle Dieciocho Santiago"),
        ("plaza-rio-mapocho", "Parque de los Reyes edge", "nature", "Mapocho", "Parque de los Reyes Santiago"),
        ("centro-cultural-españa", "Centro Cultural de España", "culture", "Lastarria", "Centro Cultural de España Santiago"),
        ("instituto-chileno-norteamericano", "Instituto Chileno Norteamericano", "culture", "Lastarria", "Instituto Chileno Norteamericano Santiago"),
        ("barrio-italia-italia-square", "Plaza Chile-España", "plaza", "Italia", "Plaza Chile España Barrio Italia"),
        ("providencia-los-leones", "Los Leones", "barrio", "Providencia", "Los Leones Providencia Santiago"),
        ("metro-baquedano-surface", "Entorno superficie Baquedano", "micro", "Providencia", "Plaza Baquedano Santiago superficie"),
        ("recoleta-iglesia-domingo", "Iglesia de la Recoleta Franciscana", "micro", "Recoleta", "Iglesia de la Recoleta Franciscana Santiago"),
        ("cementerio-catolico", "Cementerio Católico", "memory", "Recoleta", "Cementerio Católico Santiago"),
        ("parque-forestal-castano", "Paseo del castaño Parque Forestal", "micro", "Forestal", "Parque Forestal Santiago paseo"),
        ("lastarria-jose-miguel-de-la-barra", "José Miguel de la Barra", "micro", "Lastarria", "José Miguel de la Barra Santiago"),
        ("bellavista-antonia-lopez-de-bello", "Antonia López de Bello", "micro", "Bellavista", "Antonia López de Bello Bellavista"),
        ("san-cristobal-casa-de-piedra", "Casa de Piedra San Cristóbal", "micro", "San Cristóbal", "Casa de Piedra Parque Metropolitano Santiago"),
        ("quinta-normal-invernadero", "Invernadero Quinta Normal", "micro", "Quinta Normal", "Invernadero Parque Quinta Normal"),
        ("matucana-ex-carcel", "Entorno Ex Penitenciaría / memoria", "memory", "Quinta Normal", "Ex Penitenciaría Santiago Matucana"),
        ("nunoa-iglesia", "Iglesia de Ñuñoa", "micro", "Ñuñoa", "Parroquia de Ñuñoa Santiago"),
        ("nunoa-teatro", "Teatro Universidad Católica Ñuñoa", "culture", "Ñuñoa", "Teatro UC Ñuñoa"),
        ("penalolen-mall-florida", "Entorno Peñalolén acceso Villa Grimaldi", "micro", "Peñalolén", "Peñalolén Santiago Villa Grimaldi acceso"),
        ("las-condes-iglesia-san-vicente", "San Vicente Ferrer", "micro", "Las Condes", "Iglesia San Vicente Ferrer Las Condes"),
        ("vitacura-parque", "Parque Bicentenario Vitacura", "nature", "Vitacura", "Parque Bicentenario Vitacura"),
        ("loja-barrio", "Barrio Lourdes / edge Yungay", "micro", "Yungay", "Barrio Lourdes Santiago Yungay"),
        ("compania-de-jesus-ruins", "Sitio Compañía de Jesús", "memory", "Santiago Centro", "Iglesia de la Compañía Santiago incendio sitio"),
    ]
    for nid, name, kind, neighborhood, query in pad:
        if len(nodes) >= 103:
            break
        if nid in seen:
            continue
        nodes.append(node(nid, name, kind, neighborhood, query, launch=False, legacy=None))
        seen.add(nid)

    # Hard trim if somehow over (should not happen)
    nodes = nodes[:103]

    assert len(nodes) == 103, len(nodes)
    launch_ids = [n["id"] for n in nodes if n["launchCorpus"]]
    assert len(launch_ids) == 30, len(launch_ids)

    identity = {
        "schemaVersion": "physical-identity.v0.1",
        "cityId": "santiago",
        "gate": "1B.1",
        "nodeCount": len(nodes),
        "launchCorpusCount": len(launch_ids),
        "launchCorpusIds": launch_ids,
        "physicalRouteGenerationEnabled": False,
        "coordinatePolicy": "No coordinates until Mapbox geocoding. No arithmetic fallback.",
        "nodes": nodes,
    }
    identity_path = OUT_DIR / "santiago_physical_identity.v0.1.json"
    launch_path = OUT_DIR / "santiago_launch_corpus.v0.1.json"
    identity_path.write_text(json.dumps(identity, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    launch_path.write_text(
        json.dumps(
            {
                "schemaVersion": "launch-corpus.v0.1",
                "cityId": "santiago",
                "gate": "1B.1",
                "ids": launch_ids,
                "count": len(launch_ids),
                "note": "Locked Gate 1B.1 launch set. Do not expand during geocoding rerun.",
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {identity_path.relative_to(ROOT)} ({len(nodes)} nodes)")
    print(f"Wrote {launch_path.relative_to(ROOT)} ({len(launch_ids)} launch ids)")


if __name__ == "__main__":
    main()
