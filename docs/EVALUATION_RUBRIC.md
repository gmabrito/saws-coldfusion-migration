# Evaluation Rubric

Score each dimension 1-5 for both BRD and Code approaches per module.

## Scoring Scale

| Score | Meaning |
|-------|---------|
| 1 | Not implemented or fundamentally broken |
| 2 | Partially implemented, major gaps |
| 3 | Core functionality works, some gaps |
| 4 | Fully functional, minor issues |
| 5 | Complete, clean, production-quality |

## Dimensions

### 1. Feature Completeness
Does the output cover all features described in the BRD / present in the CF source?
- Are all functional requirements (Section 7) addressed?
- Are CRUD operations complete (create, read, update, delete)?
- Are search/filter capabilities present where specified?

### 2. Data Model Accuracy
Are database tables, relationships, and constraints correct?
- Do tables use the correct per-module schema?
- Are foreign keys and constraints properly defined?
- Does the data model support the required workflows?

### 3. UI Fidelity
Does the UI match the intended workflow?
- Are all forms, tables, and views present?
- Does navigation follow the EZ Link patterns?
- Is the shared AppShell used correctly?

### 4. API Design Quality
Does the API follow RESTful conventions?
- Proper HTTP methods (GET, POST, PUT, DELETE)?
- Input validation with express-validator?
- Consistent error response format?

### 5. Code Quality
Is the code clean and well-structured?
- Separation of concerns (routes, controllers, models)?
- No dead code or unused imports?
- Consistent naming conventions?

### 6. Runnability
Can it actually start and serve pages against the test database?
- Does `npm install` succeed?
- Does `npm run dev` start without errors?
- Can you perform basic CRUD operations?

### 7. Auth Integration
Does it properly use the shared auth mock?
- AuthProvider wrapping the app?
- useAuth hook for user context?
- Role-based access where specified?

### 8. Migration Log Quality
Did the AI document its decisions and assumptions?
- Are requirement IDs referenced?
- Are assumptions called out?
- Are known gaps documented?

## Process

1. Run both approaches for the same module
2. Fill out `modules/<name>/COMPARISON.md` using the template
3. Take screenshots for evidence in `evaluation/screenshots/`
4. Aggregate scores in `evaluation/summary.md`
