# Field Hero — AI vývojové prostředí krok za krokem

Návod pro laika: jak si postavit prostředí s několika AI agenty, ve kterém sám vyvineš, odladíš a nasdílíš funkční prototyp — efektivně a s minimálními náklady.

---

## Co budeš mít, až dojdeš na konec

Jednu složku na svém počítači, ve které žije celý projekt, a v ní tým pěti AI agentů. Ty zadáváš úkoly česky, agenti dělají práci:

```
TY (zadání česky)
   │
   ▼
🛠 VÝVOJÁŘ ─── napíše/upraví kód
   │
   ▼
🧪 QA TESTER ─── spustí automatické testy a validátor
   │
   ▼
🎩 OBCHODNÍ EXPERT + 🎓 TRENÉR UČENÍ ─── kritická oponentura
   │
   ▼
📊 FEEDBACK ANALYTIK ─── zpracuje zpětnou vazbu od týmu
   │
   ▼
zapracování → nová verze → sdílení s týmem → zpětná vazba → znovu
```

Celé to běží na **jednom předplatném Claude** (žádné API klíče, žádný server) + **GitHubu zdarma**.

**Náklady: cca 500 Kč měsíčně** (Claude Pro ~20 USD). Vše ostatní je zdarma. Teprve když narazíš na limity, přejdeš na Max (od ~100 USD).

---

## KROK 1 — Účty a instalace (30 minut, jednorázově)

1. **Claude Pro předplatné** — na claude.ai → Settings → Upgrade. Pro plán zahrnuje i Claude Code (tvůj hlavní nástroj).
2. **Nainstaluj aplikaci Claude Desktop** — stáhni z claude.ai/download. Po instalaci se přihlas. V aplikaci najdeš záložku **Code** — to je Claude Code, agentní prostředí, kde se všechno bude dít. (Nemusíš nikdy otevřít „černý terminál" — Code záložka je normální okno, kam píšeš česky.)
3. **Založ účet na GitHub.com** (zdarma) — bude sloužit jako trezor verzí a zdarma hosting pro sdílení. Zapamatuj si přihlašovací jméno.

> Ověření, že vše funguje: otevři Claude Desktop → záložka Code → napiš „ahoj, funguješ?". Když odpoví, máš hotovo.

---

## KROK 2 — Založ projekt (10 minut)

1. Vytvoř si na počítači složku, např. `Dokumenty/field-hero`.
2. Stáhni si z našeho chatu tři soubory a vlož je do ní:
   - `field-hero.html` (aplikace)
   - `field-hero-agenti.md` (prompty expertních agentů)
   - `field-hero-validace.js` (automatický validátor)
3. V Claude Desktop → Code → otevři tuto složku jako projekt.
4. Vlož tento prompt (Claude Code udělá zbytek sám):

```
Uspořádej tento projekt pro dlouhodobý vývoj:
1) vytvoř složky: docs/, feedback/, archiv/
2) přesuň field-hero-agenti.md do docs/
3) vytvoř soubor CLAUDE.md s tímto obsahem: jsme tým vyvíjející Field Hero —
   mobilní AI kouč pro D2D prodejce T-Mobile (Fiber, Magenta TV). Jediný zdroj
   pravdy je field-hero.html (jeden soubor, žádné závislosti). Veškerý obsah
   česky. Metodika: 5 kroků prodeje TOS, etický kodex T-Mobile Osobně (nikdy
   nepomlouvat konkurenci, vždy konečná cena). Po každé změně kódu se MUSÍ
   spustit node field-hero-validace.js a všechny testy musí projít. Před většími
   změnami si přečti docs/field-hero-agenti.md. Zálohuj předchozí verzi do archiv/.
4) nainstaluj balíček jsdom (potřebuje ho validátor) a ověř, že
   node field-hero-validace.js projde.
```

`CLAUDE.md` je „paměť projektu" — Claude Code si ho přečte při každém startu, takže mu nemusíš pravidla opakovat.

---

## KROK 3 — Vytvoř tým agentů (15 minut)

Agenti v Claude Code jsou obyčejné textové soubory ve složce `.claude/agents/`. Nemusíš je psát ručně — vlož tento prompt:

```
Vytvoř ve složce .claude/agents/ těchto 5 agentů (markdown s YAML hlavičkou):

1) vyvojar.md — name: vyvojar, model: sonnet, všechny nástroje.
   Role: implementuje změny ve field-hero.html. Vždy: záloha do archiv/,
   minimální zásah, po změně spustit validátor a opravit, co neprojde.

2) qa-tester.md — name: qa-tester, model: haiku, nástroje: Read, Bash, Grep.
   Role: spouští node field-hero-validace.js, kontroluje syntaxi a že se
   všechny obrazovky vykreslí. Vrací stručný report ✓/✗ s čísly řádků.
   Nikdy nemění kód.

3) obchodni-expert.md — name: obchodni-expert, model: sonnet,
   nástroje: Read, Grep (jen čtení).
   Role: masterclass D2D obchodník. Řídí se přesně promptem AGENT 1
   v docs/field-hero-agenti.md. Výstup: nálezy KRITICKÉ→NÍZKÉ + top 3 opravy.

4) trener-uceni.md — name: trener-uceni, model: sonnet,
   nástroje: Read, Grep (jen čtení).
   Role: expert na učení a engagement. Řídí se promptem AGENT 2
   v docs/field-hero-agenti.md. Výstup: nálezy + top 3 změny.

5) feedback-analytik.md — name: feedback-analytik, model: sonnet,
   nástroje: Read, Grep.
   Role: čte soubory ve složce feedback/ (JSONL exporty od trenérů +
   poznámky týmu), seskupí je podle témat, spočítá četnost a vrátí
   prioritizovaný backlog: co opravit hned / příště / nápady. U korekcí
   od trenérů navrhne konkrétní úpravu promptů nebo obsahu aplikace.

Po vytvoření mi vypiš seznam agentů k potvrzení.
```

> Alternativa naklikáním: napiš do Claude Code příkaz `/agents` — otevře se průvodce, kde agenty vytvoříš interaktivně. Pozor: agenty vytvořené ručně jako soubory se načtou až po restartu session.

**Proč tyhle modely:** QA běhá pořád → nejlevnější Haiku. Vývoj a oponentura → Sonnet (poměr cena/výkon). Nejsilnější model si šetři na občasné velké audity (viz Krok 9).

---

## KROK 4 — Tvůj pracovní den (takhle to používáš)

Všechno zadáváš česky v záložce Code. Agenty voláš jménem, nebo je Claude zapojí sám. Typické příkazy:

**Nová funkce:**
```
Chci do aplikace přidat týdenní přehled výsledků na obrazovku Dnes.
Vývojáři, navrhni řešení, implementuj, a pak ať qa-tester ověří, že vše prošlo.
```

**Oprava chyby (s obrázkem):**
```
Tady je screenshot chyby [přetáhni obrázek do okna]. Najdi příčinu a oprav.
```

**Pravidelná oponentura (1× týdně):**
```
Obchodní expert a trenér učení: projděte aktuální field-hero.html
a dejte mi nálezy. Pak vývojáři zapracuj vše KRITICKÉ a VYSOKÉ
a qa-tester to ověří.
```

**Zlaté pravidlo:** jedna session = jeden úkol. Po dokončení začni novou konverzaci (drží to kvalitu i spotřebu). Dlouhé zkoumání deleguj: „prozkoumej to přes subagenta" — hledání pak neucpe hlavní konverzaci.

---

## KROK 5 — Verzování: ať se nic neztratí (jednorázově 10 minut)

Vlož do Claude Code:

```
Založ v tomto projektu git repozitář, vytvoř první commit a nahraj ho
na můj GitHub jako privátní repozitář field-hero. Proveď mě přihlášením.
```

Claude Code tě provede (jednorázové potvrzení v prohlížeči). Od té chvíle po každé větší změně řekni jen: **„ulož verzi s popisem co jsme změnili"**. Kdykoli se něco pokazí: **„vrať aplikaci do včerejší verze"**.

---

## KROK 6 — Sdílení s týmem (dvě cesty)

**Cesta A — plná verze s AI (pro trenéry a pilotní tým):**
Publikuj aplikaci jako artefakt na claude.ai (nahraj HTML do chatu → „otevři jako artefakt" → Publish → pošli odkaz). Funguje živý AI zákazník, hodnocení i trvalé ukládání. Diváci potřebují Claude účet (stačí free). Odkaz je veřejný — před publikací zvaž anonymizaci provizních čísel.

**Cesta B — rychlé demo zdarma (pro stakeholdery):**
```
Zapni pro repozitář field-hero GitHub Pages a dej mi veřejnou adresu aplikace.
```
Dostaneš URL typu `tvojejmeno.github.io/field-hero` — funguje komukoli bez účtu, ale v offline režimu (heuristické hodnocení místo živé AI). Výhoda: při každém „ulož verzi" se web sám aktualizuje.

**Pravidlo:** trenéři a kalibrace → cesta A. Ukázka vedení a sběr dojmů → cesta B.

---

## KROK 7 — Smyčka zpětné vazby (týdenní rituál, 20 minut)

1. Trenéři ti pošlou JSONL exporty z modulu AI Trénink + tým poznámky (klidně e-mailem).
2. Vše ulož do složky `feedback/` (JSONL soubory + poznámky jako .txt).
3. V Claude Code:
```
Feedback-analytiku: zpracuj vše nového ve složce feedback/ a dej mi
prioritizovaný backlog. Pak vývojáři zapracuj top 3 položky,
qa-tester ověří a uložíme verzi.
```
Tím se kruh uzavírá: tým používá → hodnotí → agenti zapracují → nová verze tentýž den.

---

## KROK 8 — Ekonomika a šetření

| Položka | Cena | Poznámka |
|---|---|---|
| Claude Pro | ~20 USD/měs (~500 Kč) | zahrnuje Claude Code i publikaci artefaktů |
| GitHub + Pages | 0 Kč | verzování + hosting dema |
| Agenti | 0 Kč | jsou to jen textové soubory |
| API klíč, server | 0 Kč | pro prototyp nepotřebuješ |

Jak zůstat levný: QA a průzkum na Haiku (nastaveno v agentech), krátké sessions místo jedné nekonečné, velký audit nejsilnějším modelem max 1× týdně (v session přepneš příkazem `/model`), a subagenty na „hrabání" v kódu — izolují spotřebu. Když začneš narážet na denní limity Pro, je čas na Max — to už znamená, že prototyp žije, a je to dobrá zpráva.

---

## KROK 9 — Co dál, až prototyp obstojí

1. **Vlastní backend** — až budeš chtít společné úložiště zpětné vazby pro celý tým mimo Claude, máš připravený plán v `field-hero-backend-qnap.md` (QNAP + Cloudflare Tunnel). Zadáš ho vývojáři jako úkol.
2. **API klíč** — pro nasazení mimo claude.ai (vlastní doména, žádné přihlašování) se přidá Anthropic API klíč přes malý server; jednotky stovek Kč měsíčně dle používání.
3. **Fine-tuning dataset** — JSONL exporty od trenérů průběžně schraňuj; až jich budou stovky, je to základ pro doučení modelu na míru.

---

## Tahák: prvních 7 dní

- **Den 1:** Krok 1 + 2 (účty, instalace, projekt) ✓
- **Den 2:** Krok 3 + 5 (agenti, GitHub) ✓
- **Den 3:** první úkol vývojáři + QA — vyzkoušej si smyčku na drobnosti
- **Den 4:** první týdenní oponentura obou expertů, zapracování
- **Den 5:** publikace pro 2–3 trenéry (cesta A) + GitHub Pages demo (cesta B)
- **Den 6–7:** sběr první zpětné vazby → složka feedback/ → analytik → verze 2

Kompletní dokumentace pro hlubší studium: https://docs.claude.com/en/docs/claude-code/overview (Claude Code) a https://support.claude.com (claude.ai, artefakty, publikace).
