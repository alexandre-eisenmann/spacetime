# Incremental historical coverage

23 events across six named spans. This is a small curated selection, not a complete chronology.

| Span | Displayed coverage | Meaning |
|---|---|---|
| Achaemenid Persia | 550–330 BCE | Conventional dynastic span |
| Athens · fifth century | 480–404 BCE | Selected city-state chapter; Athens continued afterward |
| Sparta · classical power | 480–371 BCE | Selected city-state chapter; Sparta continued afterward |
| Roman Republic | c. 509–27 BCE | Traditional beginning; 27 BCE belongs to imperial phase in this year-level model |
| Early Roman Empire | 27 BCE–117 CE | Selected phase through Hadrian’s accession, not the end of the Empire |
| Alexander’s campaigns | 336–323 BCE | Existing narrative from accession through death, with illustrative campaign stages |

Persia, the Macedonian story, the Republic, the Empire and World War II show Cliopatria v0.2.1 polygons under Cliopatria's polity names (status `unreviewed`; see README). Where a Cliopatria row contradicts the historical record, `scripts/cliopatria-corrections.ts` renames, re-dates or regroups it, with cited evidence, and never edits geometry. Today that covers Alexander's 331–324 BCE conquests, which Cliopatria files under "Ptolemaic Kingdom" and a surviving "Achaemenid Empire". They now count as the Macedonian Empire, Persia ends in 330 BCE, and the regent Polyperchon (318–316 BCE) belongs to the "(Macedonian Empire)" grouping. The map popup shows a corrected row's note. The Macedonian story follows that grouping, so the regents Cliopatria maps separately after 323 BCE are drawn as part of the empire. Athens and Sparta polygons remain original illustrative sketches. Only the Macedonian story has routes, schematic lines with arrows through the stops Arrian and Diodorus record: Alexander's army from Pella in 334 BCE to Babylon in 323 BCE, Nearchus's fleet from the Indus to Susa (325–324 BCE), and Seleucus, Lysimachus and Antigonus marching to Ipsus (302–301 BCE). World War II has many simultaneous fronts and no authored offensives yet; Persia, the Republic, the Empire and the chapters have too few events to trace a movement, and routes are never guessed from the order of events. A timeline filter changes rows only; the map continues to show all date-valid records. Events are dots at timeline windows of 200 years or less (hidden in wider overviews to avoid crowding), separate from bars, and map event markers appear only at their selected year. Uncertain events use the latest bound for their anchor and show the full range on cards.

## References and editorial decisions

- [The Met: Achaemenid Persia](https://www.metmuseum.org/essays/the-achaemenid-persian-empire-550-330-b-c) supports the dynastic span and Cyrus/Cambyses milestones. No geometry was extracted. This source’s Salamis year differs from the commonly used chronology; Salamis was not included in this incremental selection.
- [The Met: Classical Greece](https://www.metmuseum.org/essays/the-art-of-classical-greece-ca-480-323-b-c) supports the Athenian context and the treasury move, retained as 454–453 BCE rather than collapsed into an exact year.
- [World History Encyclopedia: Peloponnesian War](https://www.worldhistory.org/Peloponnesian_War/) supports the 431–404 BCE conflict. Athens and Sparta remain separate polities.
- [World History Encyclopedia: Leuctra](https://www.worldhistory.org/Battle_of_Leuctra/) supports the 371 BCE milestone. The Spartan chapter begins at an editorial 480 BCE boundary, not an asserted founding date.
- [The Met: Roman Art resource](https://resources.metmuseum.org/resources/metpublications/pdf/Roman_Art_A_Resource_for_Educators.pdf) supports the conventional republican range. The initial 509 BCE date is marked approximate/traditional.
- [World History Encyclopedia: Roman Republic](https://www.worldhistory.org/Roman_Republic/) supports Carthage’s fall in 146 BCE.
- [The Met: Roman Empire](https://www.metmuseum.org/essays/the-roman-empire-27-b-c-393-a-d) supports the Augustus, Tiberius, and Hadrian accessions.
- [World History Encyclopedia: Alexander timeline](https://www.worldhistory.org/timeline/Alexander_the_Great/) supports the campaign chronology; prior Alexander references remain linked in the dataset. Alexander’s lifetime comes from the people import like everyone else’s.

Sources are linked per record and in the app’s selected-span notes. Text is original concise paraphrase; no source artwork or historical map geometry is copied. Dates and summaries have not undergone independent scholarly review. Approximate coordinates are separately attributed to the local editorial artifact.

## Adding a historical figure

Historical people come from the people import (`pnpm data:people`, see README), so no figure has a hand-made lifetime; members of the spacetime team are listed in `src/data/team.ts`. A story about a person, such as Alexander’s campaigns, is a campaign or phase span with optional events linked by stable IDs. Add any rule, control, influence or campaign geometry as separately dated records linked to the relevant campaign/phase. Do not copy the lifespan into geographic validity. Version 2 validates that lifetime spans reference a person.
