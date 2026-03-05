**Phase 1: Content Architecture (The Brain)**

Before building a UI, transform existing PDFs, slides, and videos into a structured database.

- **Lesson Block Data Model:** Treat every topic (e.g., Ohm’s Law) as a single learning object.
	- **Metadata:** Title, Discipline, Difficulty Level, Estimated Duration.
	- **Narrative:** Short summary of the lesson.
	- **Primary Asset:** Worksheet (PDF).
	- **Supportive Asset:** Slide deck (PPT → PDF for web viewing).
	- **Visual Asset:** YouTube embed (internal player).
	- **Hardware Tagging:** Matrix kit IDs required (e.g., LK9329).

- **Content Organization:** Organize materials into a clear hierarchy:
	- **Level 1 (Discipline):** Electrical Engineering
	- **Level 2 (Course):** Fundamentals of Electricity
	- **Level 3 (Module):** DC Circuits
	- **Level 4 (Topic):** Ohm's Law

**Phase 2: User Interface (The Workspace)**

Make the app feel like a Course Builder rather than a file folder.

- **Sieve (Selection Sidebar):** Nested tree-view with checkboxes and smart filters (by Level or owned Matrix hardware).

- **Workbench (Central Column):** Selected items appear as Lesson Cards.
	- **Drag-and-Drop:** Use `dnd-kit` for reordering.
	- **Calendar Logic:** Set a start date; auto-assign Week 1, Week 2, etc.

- **Internal Viewer (The Stage):** Overlay or split-pane when opening a lesson card.
	- **PDF Viewer:** Integrated viewer (e.g., React-PDF).
	- **Video Player:** Branded YouTube embed without suggested-video distractions.

**Phase 3: Generator Engine (The Output)**

Provide value by automating lecturers' paperwork.

- **Master Scheme Document:** Auto-generate a professional table including:
	- **Weekly Breakdown:** Week 1–20
	- **Learning Objectives:** Pulled from lesson data
	- **Assessment:** Editable field for grading approach
	- **Equipment Checklist:** Consolidated Matrix equipment list

- **Export Options:**
	- **Course Pack (PDF):** Merge selected worksheets into a single, numbered PDF.
	- **VLE Export (ZIP):** Include SoW and all assets for upload to Moodle/Blackboard/Canvas.

**Phase 4: Technical Stack Recommendation**

- **Frontend:** Next.js (React) — fast, handles state and UI patterns well.
- **Database:** Strapi or Airtable — easy content management for non-dev staff.
- **File Storage:** AWS S3 — secure hosting for PDFs and slide decks.
- **Document Export:** Puppeteer or PDF-lib — for merging PDFs into a Course Pack.

**Phase 5: Implementation Roadmap (How-to)**

- **Month 1 — Audit:** Collect materials (Ohm's Law, Kirchhoff's Law, basic circuits). Map into a spreadsheet with Phase 1 fields.
- **Month 2 — MVP Development:** Build a basic web app allowing selection of 5–10 topics and listing them.
- **Month 3 — Viewer & Export:** Add internal PDF viewer and Export to PDF functionality.
- **Month 4 — Beta Testing:** Give to 3 lecturers using Matrix equipment; ask if it saves planning time.

**Logic Example**

- **Lecturer Checks:** Ohm's Law, Series Circuits, Parallel Circuits
- **App Generates:**
	- Lesson 1: Ohm's Law (Requires Locktronics Kit 1)
	- Lesson 2: Series Circuits (Requires Locktronics Kit 1)
	- Lesson 3: Parallel Circuits (Requires Locktronics Kit 1)
- **Automated Note:** All selected lessons use the same hardware kit — no equipment swap needed.

1.. The Foundation: Tag-Based MappingEvery "Lesson Block" in your database needs a hidden field called required_hardware. This is a list of SKU codes for Matrix TSL products.Lesson: Ohm’s Law → Tags: [LK9329 (Locktronics Base)], [LK5250 (Resistor Pack)]Lesson: Solar Power Fundamentals → Tags: [LK3127 (Solar Panel Kit)], [LK9329 (Locktronics Base)]2. The Recommendation Engine (The Logic)Once the lecturer finishes picking their 20 topics, the "Recommendation Engine" runs a three-stage scan:Stage A: The "Core Kit" IdentifierThe app looks for the most frequently appearing tags. If 15 out of 20 lessons require the LK9329 Baseboard, the system identifies this as the Primary Requirement.Output: "To teach this course, you need 1x Locktronics Core Set (LK9329) per student station."Stage B: The "Gap Analysis" (Add-on Logic)The system identifies "specialist" lessons that require extra gear. If the user added one lesson on "Three Phase Motors," the system flags the specific expansion kit.Output: "Note: Lesson 14 requires the 'Three Phase Motors Expansion.' We recommend 1 kit per 4 students."Stage C: DeduplicationThe engine ensures it doesn't recommend the same baseboard five times just because five different lessons use it. It "flattens" the list into a single, clean Bill of Materials (BOM).3. How it Looks to the User (The UI)After clicking "Generate Scheme of Work," the user sees a "Hardware Requirements" dashboard before they download their PDF.The "Recommended Lab" TableRecommended ItemRoleWhy is this recommended?Electrical Machines Core SetEssentialRequired for 80% of your selected curriculum.Battery Simulator BoxModule SpecificNeeded specifically for "Lesson 12: EV Storage."Digital MultimeterConsumableEssential for all practical measurements.4. Smart Features for Matrix TSLA. "I Already Own..." FilterAllow the lecturer to check a box saying "My college already has 10x Locktronics Baseboards." The app then intelligently subtracts those from the recommendation, showing them only the "Expansion Kits" they need to buy to make the new course work.B. The "Request Quote" HookInstead of just a list, provide a button: "Email this equipment list to my Matrix Account Manager."The app sends an automated email to your sales team with the lecturer’s name, their generated Scheme of Work, and the exact list of hardware they are missing.Result: Your sales team gets a "warm lead" who has already committed to the curriculum.C. Scalability CalculatorLet the user input their class size (e.g., "30 students"). The app then multiplies the recommendation (e.g., "You need 15 kits for 30 students working in pairs").5. Technical ImplementationDatabase: Add a products table that links to your lessons table via a "many-to-many" relationship.Algorithm: A simple JavaScript function that iterates through the selectedLessons array, collects all hardwareTags, and uses a Set() to remove duplicates.Front-End: Use a "Shopping Cart" style summary page that appears after the SoW is built.Example ScenarioA lecturer builds a "Renewable Energy" course.They pick: Wind Turbines, Solar Cells, and Hydro Power.The app sees the tags for each.Recommendation: It suggests the "Matrix Renewable Energy All-in-One" kit rather than three separate kits, saving the college money and lab space.