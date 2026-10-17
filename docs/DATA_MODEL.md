# Historical data contract — version 2

The pipeline is **external reference → curated source notes/draft → normalization adapter → runtime validation → generic selectors → renderer**. Collection and verification are editorial work. Rendering does not scrape, infer, or verify historical claims. The present foundation has no ingestion server.

## Normalized records

A `HistoricalDataset` contains sources, entities, spans, places, events, and temporal geographic features. IDs are stable, namespaced within this dataset, and unique across record types; references use IDs instead of duplicating linked records. Period kinds include campaigns, reigns, eras, and cultural spans. Entities can represent people, polities, cultures, or places. Events link to spans, participants, a place and provenance. Geographic features independently link to spans/participants and carry valid-time intervals.

Sources record title, URL or local artifact path, access date, and reuse notes. Every claim-bearing record has source IDs, method, note and review status. Status distinguishes `illustrative`, `unreviewed`, and `reviewed`. Validation establishes structural integrity, never historical truth. Currently no historical geometry is reviewed.

Geographic relations distinguish `campaign-extent`, `control`, `influence`, `route`, and `cultural-area`. These are not interchangeable. Imported Cliopatria polygons are `control` features with status `unreviewed`; `src/data/territories.ts` attaches them to the spans whose subjects are those polities, not to the authored datasets. Polity entities come from `src/data/polities.ts`, one per Cliopatria polity or grouping, so every story about a polity references the same entity. `mergeDatasets` accepts an entity from several datasets only when every copy is identical. Supported geometry is WGS84 longitude/latitude Point, LineString, Polygon, or MultiPolygon. Validation checks coordinate bounds and ring closure; it does not detect self-intersections or historical plausibility. A future ingestion process should add topology checks and scholarly review.

Routes are the only `LineString` features, and only routes may carry `mode` (`land`, the default, or `sea`). A dataset authors a route as a `Route` (`src/domain/routes.ts`): an id, title, spans, participants, the year it ends (`until`), a start point and yearly legs, each a list of stops the ancient or modern record attests. `routeFeatures` turns it into one `route` feature per leg, tagged with the route's `routeId`, each starting where the previous leg ended and valid from its year until the route ends, so the map grows the path year by year and keeps the earlier legs as a trail. It rejects legs without stops, years out of order and an end before the last leg. Routes are straight lines between recorded stops with status `illustrative`; they are never inferred from the order of events. Atlas draws every route the same way: a dark line over a white casing (dashed at sea), bolder for the leg of the current year, with one arrowhead whose tip sits at the end of each route's latest visible leg, where its mover is that year. Routes share the story territories layer toggle.

## Time

Internally, years use astronomical numbering: 0 means 1 BCE; -1 means 2 BCE; 1 means 1 CE. There is no displayed year zero. `fromEra` is the sole era conversion boundary. Do not use JavaScript `Date` for historical years. Foundation precision is explicitly year-only; month/day calendar conversion is intentionally unsupported.

Every date has inclusive earliest/latest bounds, precision, and exact/approximate/disputed certainty. Exact dates must have identical bounds. Interval endpoints also have bounds and must be ordered without overlap. Validity intervals are inclusive by default; `endExclusive` supports non-overlapping phase transitions at year resolution. Conservative selection (default) shows a feature only from its latest possible start to earliest possible end. Possible selection includes the full uncertainty envelope. Events are considered definitely in the past at their latest possible date. UI event projections use that latest bound. Event cards display the full date range and certainty; their timeline anchor uses the latest possible year. A future timeline should also draw uncertainty bands.

The example's exact year means the adopted narrative milestone is assigned to that year, not that the underlying geometry is exact. Approximate coordinates and illustrative geometry have separate explicit status. No interpolation occurs between campaign stages.

## Boundary and extension workflow

1. Collect references and record provenance and reuse rights independently from rendering. Preserve source wording and alternative interpretations in editorial work, not in UI code.
2. Curate events/places/entities and source IDs. Do not guess unknown dates or boundaries. Author new adapters for external source formats; do not teach the renderer their field names.
3. Normalize into schema version 2, using `fromEra` for BCE/CE. Call `loadDataset(unknown)` before making records available to selectors. Invalid IDs/references, geometry, date intervals and unsupported versions are rejected, never silently coerced.
4. Review claims independently; explicitly change status only after review. Sources for chronology do not prove polygon geometry. The example's geometry cites its local editorial artifact rather than attributing invented borders to the historical references.
5. Use `eventViews`, `latestEvent`, and `featuresAt` with any validated dataset and span ID. `Atlas` accepts those dataset/period inputs and does not import Alexander data.

The app combines validated datasets into one catalog and displays concurrent typed spans on separate rows. The Stories/People filter affects timeline rows only. Map layers independently use date-valid geographic records. A production loader should show validation diagnostics rather than a blank page if a user-imported dataset is rejected, and should version/archive reviewed dataset releases. Add record-level bibliographic locators and reviewer identities before scholarly publication. No ingestion/curation dashboard is implied by this prototype.

Version 2 replaces `periods`/`periodIds` with `spans`/`spanIds`. No persisted user datasets existed in this prototype; future external version-1 data needs an explicit adapter. `mergeDatasets` revalidates global IDs and references. See COVERAGE.md for the initial multi-history selection.
