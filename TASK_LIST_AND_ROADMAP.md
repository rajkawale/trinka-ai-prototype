# Trinka AI Prototype - Comprehensive Task List & Implementation Roadmap

## 🎯 Overview
Complete implementation plan for Trinka AI Writing Assistant Prototype based on master feature list and user requirements.

---

## 📋 Priority 0 (P0) - Critical Fixes (IMMEDIATE)

### Task Group: Writing Quality Panel & Score Fixes

#### 1. Fix Score Panel Positioning & Overlap Issues ⚠️
- **Issue**: Score panel overlaps with Copilot sidebar
- **Solution**: Move panel to left side when Copilot is open, or adjust positioning logic
- **Time**: 2 hours
- **Branch**: `fix/score-panel-positioning`

#### 2. Make Quality Factors Clickable with Improvement Suggestions
- **Status**: Partially done - need to integrate with ImprovementSuggestionsModal
- **Tasks**:
  - Connect quality factor clicks to open ImprovementSuggestionsModal
  - Add action items that can improve the document
  - Wire up "Apply Fix" functionality to editor
- **Time**: 4 hours
- **Branch**: `feat/clickable-quality-factors`

#### 3. Update Quality Factors to Match Image Reference
- **Update factors**: Correctness, Clarity, Tone, Engagement, Structure
- **Match labels**: "Good", "Crisp", "Needs Polish", "High", "1 headings"
- **Time**: 1 hour
- **Branch**: `feat/update-quality-factors`

---

## 🔍 Phase P0 Remaining (From Original Roadmap)

### Task Group: Core Editor Features

#### 4. Token Click Replace Reliability ⏳
- **Task**: Implement robust mapping utility for char offsets to DOM nodes
- **Details**:
  - Create `findNodeForOffset` utility
  - Implement `ReplaceRangeWithFragment` with atomic undo
  - Handle token alignment from AI responses
  - Ensure single undo step and caret placement
- **Time**: 6 hours
- **Branch**: `feat/token-replace-reliability`

#### 5. Selection Change Cancellation Logic
- **Status**: Partially implemented
- **Enhancements**:
  - Show "Selection changed" message when cancelled
  - Better cleanup of running AI requests
- **Time**: 2 hours
- **Branch**: `feat/selection-cancellation`

---

## 🎨 Phase P1 - Branding & UX Polish

### Task Group: Trinka Branding Integration

#### 6. Verify and Apply Trinka.ai Branding ⭐
- **Tasks**:
  - Research Trinka.ai website for official colors and logo
  - Update color palette throughout app (#6C2BD9 currently used)
  - Replace all logo references with official Trinka logo
  - Ensure brand consistency in all UI components
- **Time**: 3 hours
- **Branch**: `feat/trinka-branding`

#### 7. Update All UI Components with Brand Colors
- **Components to update**:
  - SuggestionPopup (already done ✓)
  - WritingQualityPanel
  - ScorePill
  - Copilot
  - Buttons and interactive elements
- **Time**: 4 hours
- **Branch**: `feat/brand-colors-update`

---

## 🧪 Phase P1 - Tests & Quality Assurance

### Task Group: Testing Infrastructure

#### 8. Update Jest Mocks for New Module Paths
- **Tasks**:
  - Update moduleNameMapper in jest config
  - Mock useAI, useEditorState hooks
  - Fix broken test imports
- **Time**: 3 hours
- **Branch**: `test/update-mocks`

#### 9. Add E2E Tests for Critical Flows
- **Test scenarios**:
  - Popup stacking behavior
  - Selection change cancellation
  - Undo behavior after token replacement
  - Quality panel toggle
- **Time**: 8 hours
- **Branch**: `test/e2e-critical-flows`

---

## 🚀 Phase P1 - Feature Enhancements

### Task Group: Fact Check Feature

#### 10. Fact Check MVP Implementation
- **Tasks**:
  - Implement `/api/ai/fact-check` mock endpoint
  - Highlight claims in editor
  - Add Copilot "Fact Check" tab
  - Show citation suggestions
- **Time**: 8 hours
- **Branch**: `feat/factcheck-mvp`

### Task Group: Copilot Improvements

#### 11. Copilot Conversation History
- **Tasks**:
  - Save conversation history to localStorage (stub for future DB)
  - Add conversation persistence
  - Implement conversation list/navigation
- **Time**: 5 hours
- **Branch**: `feat/copilot-history`

#### 12. Copilot Action Buttons
- **Tasks**:
  - Add "Insert to doc" button
  - Add "Copy" button
  - Add "Retry" action
  - Add thumbs up/down feedback
- **Time**: 4 hours
- **Branch**: `feat/copilot-actions`

---

## ♿ Phase P1 - Accessibility

### Task Group: Keyboard & Accessibility

#### 13. Keyboard Navigation & Accessibility
- **Tasks**:
  - Tab indexing for token clicks
  - Enter to apply suggestions
  - Esc to close popups
  - ARIA labels for screen readers
  - Focus management
- **Time**: 6 hours
- **Branch**: `feat/accessibility`

---

## 🔧 Phase P2 - Core Infrastructure

### Task Group: LLM Integration

#### 14. LLM Adapter & IModelClient Interface
- **Tasks**:
  - Create IModelClient abstraction
  - Implement OpenAIAdapter template
  - Add feature flag to switch between mock and real API
  - Create adapter for other LLM providers
- **Time**: 12 hours
- **Branch**: `feat/llm-adapter`

### Task Group: Data Persistence

#### 15. Conversation Database
- **Tasks**:
  - Design conversation schema
  - Implement local DB stub (IndexedDB)
  - Prepare for server-side migration
- **Time**: 8 hours
- **Branch**: `feat/conversation-db`

#### 16. RAG Pipeline for Fact Check Citations
- **Tasks**:
  - Research citation backend design
  - Implement citation extraction
  - Add citation suggestion UI
- **Time**: 16 hours
- **Branch**: `feat/rag-citation`

---

## 💡 Suggested Improvements (New Ideas)

### Task Group: Writer Experience Enhancements

#### 17. Writing Goals Integration ⭐
- **Enhancement**: Connect Writing Goals to quality scoring
- **Tasks**:
  - Use audience/formality/domain preferences in scoring
  - Show personalized suggestions based on goals
- **Time**: 4 hours
- **Branch**: `feat/goals-integration`

#### 18. Real-time Writing Score Updates
- **Enhancement**: Score updates as user types (debounced)
- **Tasks**:
  - Implement real-time analysis
  - Show score changes with animation
- **Time**: 6 hours
- **Branch**: `feat/realtime-score`

#### 19. Writing Insights Dashboard
- **Enhancement**: Weekly/monthly writing statistics
- **Tasks**:
  - Track writing improvements over time
  - Show improvement trends
- **Time**: 8 hours
- **Branch**: `feat/insights-dashboard`

#### 20. Document Versioning & History
- **Enhancement**: Better version management
- **Tasks**:
  - Improve version history UI
  - Add diff view between versions
  - Allow version restore with preview
- **Time**: 10 hours
- **Branch**: `feat/version-history`

#### 21. Export Options
- **Enhancement**: Export documents in multiple formats
- **Tasks**:
  - PDF export
  - Word document export
  - Markdown export
- **Time**: 6 hours
- **Branch**: `feat/export-options`

#### 22. Collaboration Features
- **Enhancement**: Share documents for review
- **Tasks**:
  - Generate shareable links
  - Comment system
  - Review mode
- **Time**: 16 hours
- **Branch**: `feat/collaboration`

#### 23. Writing Templates
- **Enhancement**: Pre-built templates for different document types
- **Tasks**:
  - Academic paper template
  - Email template
  - Blog post template
- **Time**: 4 hours
- **Branch**: `feat/writing-templates`

#### 24. Smart Suggestions Based on Context
- **Enhancement**: Context-aware AI suggestions
- **Tasks**:
  - Analyze surrounding text
  - Provide contextually relevant suggestions
  - Learn from user preferences
- **Time**: 12 hours
- **Branch**: `feat/contextual-suggestions`

---

## 📊 Implementation Plan by Priority & Time

### Week 1 (40 hours) - Critical Fixes & Foundation
1. ✅ Fix Score Panel Positioning (2h)
2. ✅ Make Quality Factors Clickable (4h)
3. ✅ Update Quality Factors (1h)
4. ⏳ Token Replace Reliability (6h)
5. ⏳ Selection Cancellation Enhancements (2h)
6. ⏳ Trinka Branding Research & Apply (3h)
7. ⏳ Brand Colors Update (4h)
8. ⏳ Writing Goals Integration (4h)
9. ⏳ Update Jest Mocks (3h)
10. ⏳ Testing Critical Paths (8h)
11. ⏳ Code Review & Bug Fixes (3h)

### Week 2 (40 hours) - Feature Implementation
1. ⏳ Fact Check MVP (8h)
2. ⏳ Copilot History (5h)
3. ⏳ Copilot Actions (4h)
4. ⏳ Accessibility Improvements (6h)
5. ⏳ Real-time Score Updates (6h)
6. ⏳ E2E Tests (8h)
7. ⏳ Performance Optimization (3h)

### Week 3 (40 hours) - Advanced Features
1. ⏳ LLM Adapter Implementation (12h)
2. ⏳ Conversation Database (8h)
3. ⏳ Export Options (6h)
4. ⏳ Writing Templates (4h)
5. ⏳ Document Versioning Improvements (10h)

### Week 4 (40 hours) - Polish & Future Features
1. ⏳ RAG Pipeline for Citations (16h)
2. ⏳ Writing Insights Dashboard (8h)
3. ⏳ Smart Contextual Suggestions (12h)
4. ⏳ Final Testing & Bug Fixes (4h)

---

## 🗂️ Task Grouping by Feature/Module

### Module 1: Writing Quality & Analysis
- Score Panel Positioning Fix
- Clickable Quality Factors
- Quality Factors Update
- Real-time Score Updates
- Writing Goals Integration
- Writing Insights Dashboard

### Module 2: Editor Core Features
- Token Replace Reliability
- Selection Cancellation
- Accessibility Improvements
- Document Versioning

### Module 3: AI Features
- Fact Check MVP
- LLM Adapter
- Smart Contextual Suggestions
- RAG Pipeline for Citations

### Module 4: Copilot
- Copilot History
- Copilot Actions
- Conversation Database

### Module 5: Branding & UX
- Trinka Branding Integration
- Brand Colors Update
- Export Options
- Writing Templates

### Module 6: Testing & Quality
- Jest Mocks Update
- E2E Tests
- Performance Optimization

---

## 🔄 Git Workflow Plan

### Step 1: Commit Current Changes
```bash
git add .
git commit -m "feat: implement P0 improvements - portal, score panel, branding, remove legacy toolbars"
git push origin main
```

### Step 2: Create Feature Branches (Priority Order)
```bash
# Critical fixes first
git checkout -b fix/score-panel-positioning
git checkout -b feat/clickable-quality-factors
git checkout -b feat/update-quality-factors

# Then P0 remaining
git checkout -b feat/token-replace-reliability
git checkout -b feat/selection-cancellation

# Then P1 features
git checkout -b feat/trinka-branding
git checkout -b feat/copilot-history
git checkout -b feat/factcheck-mvp
```

---

## 📝 Notes

- **Trinka.ai Branding**: Need to visit trinka.ai website to get official logo and exact color codes
- **Time Estimates**: Based on average developer productivity, may vary
- **Dependencies**: Some tasks depend on others (e.g., LLM Adapter before RAG)
- **Testing**: Should be done incrementally, not just at the end

---

## ✅ Completed Tasks (From Previous Work)

- ✅ Enhanced Portal with z-index management
- ✅ Removed legacy FloatingToolbar
- ✅ Removed legacy EditorBubbleMenu
- ✅ Created Writing Quality Panel component
- ✅ Applied Trinka branding to SuggestionPopup
- ✅ Removed Bold/Italic toolbar buttons
- ✅ Added selection change cancellation logic
- ✅ Integrated custom instruction to Copilot

---

**Last Updated**: [Current Date]
**Status**: Ready for implementation
