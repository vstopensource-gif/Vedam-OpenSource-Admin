// Form Builder Module
import { db, collection, doc, getDoc, setDoc, updateDoc, Timestamp, getDocs } from '../firebase-config.js';
import { showLoading, hideLoading } from './utils.js';
import { getCurrentUser } from './auth.js';

let currentForm = null;
let currentStage = 1; // 1 or 2
let formData = {
    name: '',
    description: '',
    category: '',
    tags: [],
    status: 'draft',
    settings: {
        allowMultipleSubmissions: false,
        submissionLimit: null,
        startDate: null,
        endDate: null,
        redirectUrl: '',
        redirectType: 'same-page',
        confirmationMessage: 'Thank you for your submission!'
    },
    fields: [],
    sections: []
};
let selectedField = null;
let selectedSection = null;
let history = [];
let historyIndex = -1;

/**
 * Initialize form builder
 */
window.initializeFormBuilder = async function(formId = null) {
    if (formId) {
        await loadForm(formId);
    } else {
        resetFormData();
    }
    renderBuilder();
};

/**
 * Load existing form
 */
async function loadForm(formId) {
    try {
        showLoading();
        const formRef = doc(db, 'forms', formId);
        const formSnap = await getDoc(formRef);
        
        if (formSnap.exists()) {
            currentForm = formId;
            const data = formSnap.data();
            formData = {
                name: data.name || '',
                description: data.description || '',
                category: data.category || '',
                tags: data.tags || [],
                status: data.status || 'draft',
                settings: {
                    allowMultipleSubmissions: data.settings?.allowMultipleSubmissions || false,
                    submissionLimit: data.settings?.submissionLimit || null,
                    startDate: data.settings?.startDate?.toDate?.() || null,
                    endDate: data.settings?.endDate?.toDate?.() || null,
                    redirectUrl: data.settings?.redirectUrl || '',
                    redirectType: data.settings?.redirectType || 'same-page',
                    confirmationMessage: data.settings?.confirmationMessage || 'Thank you for your submission!'
                },
                fields: data.fields || [],
                sections: data.sections || []
            };
        }
    } catch (error) {
        console.error('Error loading form:', error);
        alert('Failed to load form');
    } finally {
        hideLoading();
    }
}

/**
 * Reset form data
 */
function resetFormData() {
    currentForm = null;
    formData = {
        name: '',
        description: '',
        category: '',
        tags: [],
        status: 'draft',
        settings: {
            allowMultipleSubmissions: false,
            submissionLimit: null,
            startDate: null,
            endDate: null,
            redirectUrl: '',
            redirectType: 'same-page',
            confirmationMessage: 'Thank you for your submission!'
        },
        fields: [],
        sections: []
    };
    selectedField = null;
    history = [];
    historyIndex = -1;
}

/**
 * Render builder interface
 */
function renderBuilder() {
    const builderPage = document.getElementById('formBuilderPage');
    if (!builderPage) return;

    // Preserve scroll positions
    const builderContent = document.querySelector('.builder-content');
    const stageContent = document.querySelector('.stage-content');
    const formPreview = document.getElementById('formPreview');
    const builderCanvas = document.querySelector('.builder-canvas');
    const propertiesContent = document.querySelector('.properties-content');
    
    let builderContentScroll = 0;
    let stageContentScroll = 0;
    let formPreviewScroll = 0;
    let builderCanvasScroll = 0;
    let propertiesContentScroll = 0;
    
    if (builderContent) builderContentScroll = builderContent.scrollTop;
    if (stageContent) stageContentScroll = stageContent.scrollTop;
    if (formPreview) formPreviewScroll = formPreview.scrollTop;
    if (builderCanvas) builderCanvasScroll = builderCanvas.scrollTop;
    if (propertiesContent) propertiesContentScroll = propertiesContent.scrollTop;

    builderPage.innerHTML = `
        <div class="builder-container">
            <div class="builder-header">
                <div class="builder-header-left">
                    <button class="btn btn-secondary" onclick="backToForms()">
                        <i class="fas fa-arrow-left"></i> Back to Forms
                    </button>
                    <h2>${currentForm ? 'Edit Form' : 'Create New Form'}</h2>
                </div>
                <div class="builder-header-right">
                    <div class="stage-indicator">
                        <span class="stage ${currentStage === 1 ? 'active' : ''}" data-stage="1">Stage 1: Details</span>
                        <span class="stage-divider">→</span>
                        <span class="stage ${currentStage === 2 ? 'active' : ''}" data-stage="2">Stage 2: Builder</span>
                    </div>
                    <button class="btn btn-secondary" onclick="saveDraft()">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                </div>
            </div>

            <div class="builder-content">
                ${currentStage === 1 ? renderStage1() : renderStage2()}
            </div>
        </div>
    `;

    setupBuilderEventListeners();
    
    // Restore scroll positions after DOM is ready
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const newBuilderContent = document.querySelector('.builder-content');
            const newStageContent = document.querySelector('.stage-content');
            const newFormPreview = document.getElementById('formPreview');
            const newBuilderCanvas = document.querySelector('.builder-canvas');
            const newPropertiesContent = document.querySelector('.properties-content');
            
            if (newBuilderContent && builderContentScroll > 0) {
                newBuilderContent.scrollTop = builderContentScroll;
            }
            if (newStageContent && stageContentScroll > 0) {
                newStageContent.scrollTop = stageContentScroll;
            }
            if (newFormPreview && formPreviewScroll > 0) {
                newFormPreview.scrollTop = formPreviewScroll;
            }
            if (newBuilderCanvas && builderCanvasScroll > 0) {
                newBuilderCanvas.scrollTop = builderCanvasScroll;
            }
            if (newPropertiesContent && propertiesContentScroll > 0) {
                newPropertiesContent.scrollTop = propertiesContentScroll;
            }
        });
    });
}

/**
 * Render Stage 1: Form Metadata
 */
function renderStage1() {
    return `
        <div class="builder-stage">
            <div class="stage-content">
                <div class="form-section">
                    <h3>Form Details</h3>
                    <div class="form-group">
                        <label>Form Name <span class="required">*</span></label>
                        <input type="text" id="formName" value="${escapeHtml(formData.name)}" placeholder="Enter form name" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="formDescription" rows="3" placeholder="Enter form description">${escapeHtml(formData.description)}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Category</label>
                            <input type="text" id="formCategory" value="${escapeHtml(formData.category)}" placeholder="Enter category" list="categoryList">
                            <datalist id="categoryList"></datalist>
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <input type="text" id="formTags" value="${formData.tags.join(', ')}" placeholder="Comma-separated tags">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="formStatus">
                            <option value="draft" ${formData.status === 'draft' ? 'selected' : ''}>Draft</option>
                            <option value="active" ${formData.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="closed" ${formData.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Submission Settings</h3>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="allowMultipleSubmissions" ${formData.settings.allowMultipleSubmissions ? 'checked' : ''}>
                            Allow multiple submissions per user
                        </label>
                    </div>
                    <div class="form-group">
                        <label>Submission Limit (optional)</label>
                        <input type="number" id="submissionLimit" value="${formData.settings.submissionLimit || ''}" placeholder="Maximum number of submissions" min="1">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Start Date (optional)</label>
                            <input type="datetime-local" id="startDate" value="${formatDateTimeLocal(formData.settings.startDate)}">
                        </div>
                        <div class="form-group">
                            <label>End Date (optional)</label>
                            <input type="datetime-local" id="endDate" value="${formatDateTimeLocal(formData.settings.endDate)}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Redirect Settings</h3>
                    <div class="form-group">
                        <label>After Submission</label>
                        <div class="radio-group">
                            <label>
                                <input type="radio" name="redirectType" value="same-page" ${formData.settings.redirectType === 'same-page' ? 'checked' : ''}>
                                Stay on Same Page
                            </label>
                            <label>
                                <input type="radio" name="redirectType" value="dashboard" ${formData.settings.redirectType === 'dashboard' ? 'checked' : ''}>
                                Back to Dashboard
                            </label>
                            <label>
                                <input type="radio" name="redirectType" value="custom" ${formData.settings.redirectType === 'custom' ? 'checked' : ''}>
                                Custom URL
                            </label>
                        </div>
                    </div>
                    <div class="form-group" id="customUrlGroup" style="display: ${formData.settings.redirectType === 'custom' ? 'block' : 'none'}">
                        <label>Custom URL</label>
                        <input type="url" id="redirectUrl" value="${escapeHtml(formData.settings.redirectUrl)}" placeholder="https://example.com">
                    </div>
                    <div class="form-group">
                        <label>Confirmation Message</label>
                        <textarea id="confirmationMessage" rows="3" placeholder="Thank you for your submission!">${escapeHtml(formData.settings.confirmationMessage)}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="proceedToStage2()">
                        Next: Build Form <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Stage 2: Field Builder
 */
function renderStage2() {
    return `
        <div class="builder-stage stage-2">
            <div class="builder-layout">
                <div class="builder-sidebar builder-sidebar-left">
                    <div class="sidebar-section">
                        <h4>Field Types</h4>
                        <div class="field-types-list">
                            ${getFieldTypesList()}
                        </div>
                    </div>
                    <div class="sidebar-section">
                        <h4>Sections</h4>
                        <button class="btn btn-sm btn-secondary" onclick="addSection()">
                            <i class="fas fa-plus"></i> Add Section
                        </button>
                        <div id="sectionsList" class="sections-list">
                            ${renderSectionsList()}
                        </div>
                    </div>
                </div>

                <div class="builder-canvas">
                    <div class="canvas-header">
                        <h4>Form Preview</h4>
                        <label class="toggle-label">
                            <input type="checkbox" id="livePreview" checked>
                            Live Preview
                        </label>
                    </div>
                    <div id="formPreview" class="form-preview">
                        ${renderFormPreview()}
                    </div>
                </div>

                <div class="builder-sidebar builder-sidebar-right">
                    <div id="fieldProperties" class="field-properties">
                        ${selectedField ? renderFieldProperties() : selectedSection ? renderSectionProperties() : '<p class="placeholder-text">Select a field or section to edit properties</p>'}
                    </div>
                </div>
            </div>

            <div class="builder-footer">
                <button class="btn btn-secondary" onclick="goToStage1()">
                    <i class="fas fa-arrow-left"></i> Back to Details
                </button>
                <div class="builder-footer-actions">
                    <button class="btn btn-secondary" onclick="saveDraft()">
                        <i class="fas fa-save"></i> Save Draft
                    </button>
                    <button class="btn btn-primary" onclick="publishForm()">
                        <i class="fas fa-check"></i> Publish Form
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get field types list HTML
 */
function getFieldTypesList() {
    const fieldTypes = [
        { type: 'text', icon: 'fas fa-font', label: 'Text' },
        { type: 'email', icon: 'fas fa-envelope', label: 'Email' },
        { type: 'number', icon: 'fas fa-hashtag', label: 'Number' },
        { type: 'textarea', icon: 'fas fa-align-left', label: 'Textarea' },
        { type: 'dropdown', icon: 'fas fa-list', label: 'Dropdown' },
        { type: 'multiselect', icon: 'fas fa-list-check', label: 'Multi-select' },
        { type: 'checkbox', icon: 'fas fa-check-square', label: 'Checkbox' },
        { type: 'radio', icon: 'fas fa-circle', label: 'Radio' },
        { type: 'date', icon: 'fas fa-calendar', label: 'Date' },
        { type: 'time', icon: 'fas fa-clock', label: 'Time' },
        { type: 'rating', icon: 'fas fa-star', label: 'Rating' },
        { type: 'scale', icon: 'fas fa-sliders-h', label: 'Scale' },
        { type: 'section', icon: 'fas fa-grip-lines', label: 'Section Break' },
        { type: 'pagebreak', icon: 'fas fa-file-alt', label: 'Page Break' }
    ];

    return fieldTypes.map(field => `
        <div class="field-type-item" data-type="${field.type}" onclick="addField('${field.type}')">
            <i class="${field.icon}"></i>
            <span>${field.label}</span>
        </div>
    `).join('');
}

/**
 * Render sections list
 */
function renderSectionsList() {
    if (formData.sections.length === 0) {
        return '<p class="empty-text">No sections yet</p>';
    }

    return formData.sections
        .sort((a, b) => a.order - b.order)
        .map(section => {
            const fieldCount = formData.fields.filter(f => f.sectionId === section.id).length;
            return `
                <div class="section-item ${selectedSection?.id === section.id ? 'selected' : ''}" data-section-id="${section.id}" onclick="selectSection('${section.id}')">
                    <div class="section-item-content">
                        <span class="section-item-title">${escapeHtml(section.title)}</span>
                        <span class="section-item-count">${fieldCount} field${fieldCount !== 1 ? 's' : ''}</span>
                    </div>
                    <button class="btn-icon-sm" onclick="event.stopPropagation(); deleteSection('${section.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            `;
        }).join('');
}

/**
 * Render form preview
 */
function renderFormPreview() {
    if (formData.fields.length === 0) {
        return '<div class="empty-preview"><p>Drag fields here or click field types to add</p></div>';
    }

    const sortedFields = [...formData.fields].sort((a, b) => a.order - b.order);
    
    // Check if form has page breaks
    const pageBreaks = sortedFields.filter(f => f.type === 'pagebreak');
    const hasPages = pageBreaks.length > 0;
    
    let html = '<div class="preview-form">';
    
    if (hasPages) {
        // Split into pages and render with sections
        let currentPage = 1;
        let pageFields = [];
        
        sortedFields.forEach((field, index) => {
            if (field.type === 'pagebreak') {
                // Render current page with sections
                if (pageFields.length > 0) {
                    html += `<div class="preview-page" data-page="${currentPage}">`;
                    html += `<div class="page-header">Page ${currentPage}</div>`;
                    html += renderFieldsWithSections(pageFields);
                    html += '</div>';
                }
                // Render page break
        html += renderFieldPreview(field);
                currentPage++;
                pageFields = [];
            } else {
                pageFields.push(field);
            }
        });
        
        // Render last page
        if (pageFields.length > 0) {
            html += `<div class="preview-page" data-page="${currentPage}">`;
            html += `<div class="page-header">Page ${currentPage}</div>`;
            html += renderFieldsWithSections(pageFields);
            html += '</div>';
        }
        
        // Add page navigation (for preview only)
        html += `<div class="page-navigation-preview">
            <button class="btn btn-sm btn-secondary" disabled>← Previous</button>
            <span>Page 1 of ${currentPage}</span>
            <button class="btn btn-sm btn-secondary">Next →</button>
        </div>`;
    } else {
        // Single page form - render with sections
        html += renderFieldsWithSections(sortedFields);
    }
    
    html += '</div>';
    return html;
}

/**
 * Render fields grouped by sections
 */
function renderFieldsWithSections(fields) {
    if (fields.length === 0) return '';
    
    // Filter out pagebreak fields - they're handled separately
    const regularFields = fields.filter(f => f.type !== 'pagebreak');
    if (regularFields.length === 0) return '';
    
    let html = '';
    let currentSectionId = null;
    let currentSectionFields = [];
    let currentNoSectionFields = [];
    
    regularFields.forEach((field, index) => {
        const fieldSectionId = field.sectionId || null;
        
        // If field belongs to a section
        if (fieldSectionId) {
            // If we were collecting no-section fields, render them first
            if (currentNoSectionFields.length > 0) {
                currentNoSectionFields.forEach(f => {
                    html += renderFieldPreview(f);
                });
                currentNoSectionFields = [];
            }
            
            // If section changed, render previous section
            if (fieldSectionId !== currentSectionId) {
                if (currentSectionId && currentSectionFields.length > 0) {
                    html += renderSectionWithFields(currentSectionId, currentSectionFields);
                }
                // Start new section
                currentSectionId = fieldSectionId;
                currentSectionFields = [field];
            } else {
                // Same section, add to current group
                currentSectionFields.push(field);
            }
        } else {
            // Field without section
            // If we were collecting section fields, render that section first
            if (currentSectionId && currentSectionFields.length > 0) {
                html += renderSectionWithFields(currentSectionId, currentSectionFields);
                currentSectionId = null;
                currentSectionFields = [];
            }
            // Add to no-section group
            currentNoSectionFields.push(field);
        }
    });
    
    // Render remaining section if exists
    if (currentSectionId && currentSectionFields.length > 0) {
        html += renderSectionWithFields(currentSectionId, currentSectionFields);
    }
    
    // Render remaining no-section fields
    if (currentNoSectionFields.length > 0) {
        currentNoSectionFields.forEach(field => {
            html += renderFieldPreview(field);
        });
    }
    
    return html;
}

/**
 * Render a section with its fields
 */
function renderSectionWithFields(sectionId, fields) {
    const section = formData.sections.find(s => s.id === sectionId);
    if (!section || fields.length === 0) return '';
    
    // Calculate section number based on order
    const sortedSections = [...formData.sections].sort((a, b) => a.order - b.order);
    const sectionIndex = sortedSections.findIndex(s => s.id === sectionId);
    const sectionNumber = sectionIndex >= 0 ? sectionIndex + 1 : 1;
    
    let html = `
        <div class="preview-section section-${section.backgroundStyle || 'none'} ${section.collapsible ? 'collapsible' : ''}" 
             data-section-id="${section.id}">
            <div class="section-header" onclick="selectSection('${section.id}')">
                ${section.icon ? `<i class="${escapeHtml(section.icon)}"></i>` : ''}
                <h3>
                    ${section.showSectionNumber !== false ? `<span class="section-number">${sectionNumber}.</span>` : ''}
                    ${escapeHtml(section.title)}
                </h3>
                ${section.collapsible ? '<i class="fas fa-chevron-down section-toggle"></i>' : ''}
            </div>
            ${section.description ? `<p class="section-description">${escapeHtml(section.description)}</p>` : ''}
            ${section.divider !== false ? '<hr class="section-divider">' : ''}
            <div class="section-fields">
    `;
    
    // Render all fields in this section
    fields.forEach(field => {
        html += renderFieldInSection(field);
    });
    
        html += `
            </div>
            </div>
        `;
    
    return html;
}

/**
 * Render a single field within a section (without section header)
 */
function renderFieldInSection(field) {
    if (field.type === 'pagebreak') {
        return renderFieldPreview(field);
    }
    
    if (field.hidden) {
        return ''; // Don't render hidden fields
    }
    
    const widthClass = field.width === 6 ? 'field-width-half' : field.width === 4 ? 'field-width-third' : 'field-width-full';
    return `
        <div class="preview-field ${widthClass} ${selectedField?.id === field.id ? 'selected' : ''}" 
             data-field-id="${field.id}" 
             onclick="event.stopPropagation(); selectField('${field.id}')">
            <label>
                ${field.icon ? `<i class="${escapeHtml(field.icon)}"></i>` : ''}
                ${escapeHtml(field.label || 'Untitled Field')}
                ${field.required ? '<span class="required">*</span>' : ''}
                ${field.showTooltip && field.tooltip ? `<i class="fas fa-info-circle field-tooltip" title="${escapeHtml(field.tooltip)}"></i>` : ''}
            </label>
            <div class="field-input-wrapper">
                ${field.prefix ? `<span class="field-prefix">${escapeHtml(field.prefix)}</span>` : ''}
            ${renderFieldInput(field)}
                ${field.suffix ? `<span class="field-suffix">${escapeHtml(field.suffix)}</span>` : ''}
            </div>
            ${field.helpText ? `<small class="field-help-text">${escapeHtml(field.helpText)}</small>` : ''}
            ${field.charLimit && field.showCharCounter ? `<small class="char-counter">0 / ${field.charLimit}</small>` : ''}
        </div>
    `;
}

/**
 * Render field preview (standalone - for fields without sections or special cases)
 */
function renderFieldPreview(field) {
    if (field.type === 'pagebreak') {
        return `
            <div class="preview-field pagebreak-field ${selectedField?.id === field.id ? 'selected' : ''}" 
                 data-field-id="${field.id}" 
                 onclick="event.stopPropagation(); selectField('${field.id}')">
                <div class="pagebreak-divider">
                    <hr>
                    <span>--- ${escapeHtml(field.pageTitle || 'Page Break')} ---</span>
                </div>
            </div>
        `;
    }

    if (field.hidden) {
        return ''; // Don't render hidden fields in preview
    }

    const widthClass = field.width === 6 ? 'field-width-half' : field.width === 4 ? 'field-width-third' : 'field-width-full';
    return `
        <div class="preview-field ${widthClass} ${selectedField?.id === field.id ? 'selected' : ''}" 
             data-field-id="${field.id}" 
             onclick="event.stopPropagation(); selectField('${field.id}')">
            <label>
                ${field.icon ? `<i class="${escapeHtml(field.icon)}"></i>` : ''}
                ${escapeHtml(field.label || 'Untitled Field')}
                ${field.required ? '<span class="required">*</span>' : ''}
                ${field.showTooltip && field.tooltip ? `<i class="fas fa-info-circle field-tooltip" title="${escapeHtml(field.tooltip)}"></i>` : ''}
            </label>
            <div class="field-input-wrapper">
                ${field.prefix ? `<span class="field-prefix">${escapeHtml(field.prefix)}</span>` : ''}
                ${renderFieldInput(field)}
                ${field.suffix ? `<span class="field-suffix">${escapeHtml(field.suffix)}</span>` : ''}
            </div>
            ${field.helpText ? `<small class="field-help-text">${escapeHtml(field.helpText)}</small>` : ''}
            ${field.charLimit && field.showCharCounter ? `<small class="char-counter">0 / ${field.charLimit}</small>` : ''}
        </div>
    `;
}

/**
 * Render field input based on type
 */
function renderFieldInput(field) {
    const readonlyAttr = field.readonly ? 'readonly' : '';
    const disabledAttr = 'disabled';
    const defaultValue = field.defaultValue ? `value="${escapeHtml(field.defaultValue)}"` : '';
    const charLimitAttr = field.charLimit ? `maxlength="${field.charLimit}"` : '';
    
    switch (field.type) {
        case 'text':
            const textInputType = field.inputType || 'text';
            return `<input type="${textInputType}" 
                           placeholder="${escapeHtml(field.placeholder || '')}" 
                           ${defaultValue}
                           ${charLimitAttr}
                           ${field.required ? 'required' : ''} 
                           ${readonlyAttr}
                           ${disabledAttr}
                           class="${field.customClass || ''}"
                           style="${field.autoCapitalize ? `text-transform: ${field.autoCapitalize === 'uppercase' ? 'uppercase' : field.autoCapitalize === 'lowercase' ? 'lowercase' : 'none'};` : ''}">`;
        
        case 'email':
            return `<input type="email" 
                           placeholder="${escapeHtml(field.placeholder || '')}" 
                           ${defaultValue}
                           ${charLimitAttr}
                           ${field.required ? 'required' : ''} 
                           ${readonlyAttr}
                           ${disabledAttr}
                           class="${field.customClass || ''}">`;
        
        case 'number':
            const minMaxAttrs = field.validation?.min !== undefined ? `min="${field.validation.min}"` : '';
            const maxAttr = field.validation?.max !== undefined ? `max="${field.validation.max}"` : '';
            const stepAttr = field.step !== undefined ? `step="${field.step}"` : '';
            const allowDecimals = field.allowDecimals !== false;
            return `<input type="number" 
                           placeholder="${escapeHtml(field.placeholder || '')}" 
                           ${defaultValue}
                           ${minMaxAttrs}
                           ${maxAttr}
                           ${stepAttr}
                           ${!allowDecimals ? 'step="1"' : ''}
                           ${field.required ? 'required' : ''} 
                           ${readonlyAttr}
                           ${disabledAttr}
                           class="${field.customClass || ''}">`;
        
        case 'textarea':
            const rowsAttr = field.rows ? `rows="${field.rows}"` : 'rows="3"';
            const resizeStyle = field.resizable === false ? 'resize: none;' : '';
            return `<textarea 
                           placeholder="${escapeHtml(field.placeholder || '')}" 
                           ${rowsAttr}
                           ${charLimitAttr}
                           ${field.required ? 'required' : ''} 
                           ${readonlyAttr}
                           ${disabledAttr}
                           class="${field.customClass || ''}"
                           style="${resizeStyle}">${field.defaultValue || ''}</textarea>`;
        
        case 'dropdown':
            const defaultOption = field.defaultOption || '';
            return `
                <select ${field.required ? 'required' : ''} ${readonlyAttr} ${disabledAttr} class="${field.customClass || ''}">
                    <option value="">Select...</option>
                    ${(field.options || []).map(opt => `
                        <option value="${escapeHtml(opt)}" ${opt === defaultOption ? 'selected' : ''}>${escapeHtml(opt)}</option>
                    `).join('')}
                    ${field.allowOther ? `<option value="__other__">${escapeHtml(field.otherLabel || 'Other')}</option>` : ''}
                </select>
                ${field.allowOther ? `<input type="text" placeholder="Please specify" ${disabledAttr} style="display: none; margin-top: 0.5rem;" class="other-input">` : ''}
            `;
        
        case 'multiselect':
            const maxSelections = field.maxSelections ? `data-max="${field.maxSelections}"` : '';
            return `
                <select multiple 
                        ${field.required ? 'required' : ''} 
                        ${readonlyAttr} 
                        ${disabledAttr} 
                        ${maxSelections}
                        class="${field.customClass || ''} ${field.displayMode === 'checklist' ? 'checklist-mode' : ''}">
                    ${field.selectAllOption ? `<option value="__select_all__">Select All</option>` : ''}
                    ${(field.options || []).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                </select>
            `;
        
        case 'checkbox':
            const checkboxLayout = field.layout || 'stacked';
            return `
                <div class="checkbox-group ${checkboxLayout}-layout ${field.customClass || ''}">
                    ${(field.options || []).map((opt, idx) => `
                        <label>
                            <input type="checkbox" value="${escapeHtml(opt)}" ${disabledAttr}>
                            ${escapeHtml(opt)}
                        </label>
                    `).join('')}
                    ${field.allowOther ? `
                        <label>
                            <input type="checkbox" value="__other__" ${disabledAttr}>
                            ${escapeHtml(field.otherLabel || 'Other')}
                        </label>
                        <input type="text" placeholder="Please specify" ${disabledAttr} style="display: none; margin-top: 0.5rem;" class="other-input">
                    ` : ''}
                </div>
            `;
        
        case 'radio':
            const radioLayout = field.layout || 'stacked';
            const defaultSelection = field.defaultSelection || '';
            return `
                <div class="radio-group ${radioLayout}-layout ${radioLayout === 'button-style' ? 'button-style' : ''} ${field.customClass || ''}">
                    ${(field.options || []).map((opt, idx) => `
                        <label>
                            <input type="radio" 
                                   name="radio_${field.id}" 
                                   value="${escapeHtml(opt)}" 
                                   ${opt === defaultSelection ? 'checked' : ''}
                                   ${disabledAttr}>
                            ${escapeHtml(opt)}
                        </label>
                    `).join('')}
                </div>
            `;
        
        case 'date':
            const dateFormat = field.dateFormat || 'YYYY-MM-DD';
            const minDate = field.minDate ? `min="${field.minDate}"` : '';
            const maxDate = field.maxDate ? `max="${field.maxDate}"` : '';
            const defaultDate = field.defaultDate ? `value="${field.defaultDate}"` : '';
            return `<input type="date" 
                           ${defaultDate}
                           ${minDate}
                           ${maxDate}
                           ${field.required ? 'required' : ''} 
                           ${readonlyAttr}
                           ${disabledAttr}
                           class="${field.customClass || ''}">`;
        
        case 'time':
            const timeFormat = field.timeFormat || '24h';
            const timeStep = field.step || 60;
            const includeSeconds = field.includeSeconds || false;
            const minTime = field.minTime ? `min="${field.minTime}"` : '';
            const maxTime = field.maxTime ? `max="${field.maxTime}"` : '';
            return `<input type="time" 
                           step="${includeSeconds ? timeStep : timeStep * 60}"
                           ${minTime}
                           ${maxTime}
                           ${field.required ? 'required' : ''} 
                           ${readonlyAttr}
                           ${disabledAttr}
                           class="${field.customClass || ''}">`;
        
        case 'rating':
            const starCount = field.starCount || 5;
            const iconType = field.iconType || 'star';
            const allowHalf = field.allowHalfRatings || false;
            const iconClass = iconType === 'heart' ? 'fas fa-heart' : iconType === 'emoji' ? '⭐' : 'fas fa-star';
            return `<div class="rating-preview rating-${iconType}" data-count="${starCount}" data-half="${allowHalf}">
                ${Array(starCount).fill(0).map((_, i) => 
                    iconType === 'emoji' ? '⭐' : `<i class="${iconClass}"></i>`
                ).join('')}
            </div>`;
        
        case 'scale':
            const scaleMin = field.validation?.min || 1;
            const scaleMax = field.validation?.max || 10;
            const scaleStep = field.step || 1;
            const showValue = field.showValueLabel !== false;
            return `
                <div class="scale-wrapper">
                    <input type="range" 
                           min="${scaleMin}" 
                           max="${scaleMax}" 
                           step="${scaleStep}"
                           value="${(scaleMin + scaleMax) / 2}"
                           ${field.required ? 'required' : ''} 
                           ${readonlyAttr}
                           ${disabledAttr}
                           class="scale-input ${field.customClass || ''}">
                    ${showValue ? `<span class="scale-value">${(scaleMin + scaleMax) / 2}</span>` : ''}
                </div>
            `;
        
        case 'section':
            return '';
        
        case 'pagebreak':
            return '';
        
        default:
            return '';
    }
}

/**
 * Render field properties panel
 */
function renderFieldProperties() {
    if (!selectedField) return '';

    return `
        <div class="properties-header">
            <h4>Field Properties</h4>
            <button class="btn-icon-sm" onclick="deleteField('${selectedField.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="properties-content">
            <div class="form-group">
                <label>Field Label</label>
                <input type="text" id="fieldLabel" value="${escapeHtml(selectedField.label || '')}" onchange="updateFieldProperty('label', this.value)">
            </div>
            <div class="form-group">
                <label>Placeholder</label>
                <input type="text" id="fieldPlaceholder" value="${escapeHtml(selectedField.placeholder || '')}" onchange="updateFieldProperty('placeholder', this.value)">
            </div>
            <div class="form-group">
                <label>Help Text</label>
                <input type="text" id="fieldHelpText" value="${escapeHtml(selectedField.helpText || '')}" onchange="updateFieldProperty('helpText', this.value)">
            </div>
            <div class="form-group">
                <label>Default Value</label>
                <input type="text" id="fieldDefaultValue" value="${escapeHtml(selectedField.defaultValue || '')}" onchange="updateFieldProperty('defaultValue', this.value)">
            </div>
            <div class="form-row">
            <div class="form-group">
                <label>
                    <input type="checkbox" id="fieldRequired" ${selectedField.required ? 'checked' : ''} onchange="updateFieldProperty('required', this.checked)">
                    Required Field
                </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldReadonly" ${selectedField.readonly ? 'checked' : ''} onchange="updateFieldProperty('readonly', this.checked)">
                        Read-only
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="fieldHidden" ${selectedField.hidden ? 'checked' : ''} onchange="updateFieldProperty('hidden', this.checked)">
                    Hidden Field
                </label>
            </div>
            <div class="form-group">
                <label>Field Width</label>
                <select id="fieldWidth" onchange="updateFieldProperty('width', parseInt(this.value))">
                    <option value="12" ${selectedField.width === 12 ? 'selected' : ''}>Full Width</option>
                    <option value="6" ${selectedField.width === 6 ? 'selected' : ''}>Half Width</option>
                    <option value="4" ${selectedField.width === 4 ? 'selected' : ''}>Third Width</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="fieldShowTooltip" ${selectedField.showTooltip ? 'checked' : ''} onchange="updateFieldProperty('showTooltip', this.checked)">
                    Show Tooltip
                </label>
            </div>
            ${selectedField.showTooltip ? `
                <div class="form-group">
                    <label>Tooltip Text</label>
                    <input type="text" id="fieldTooltip" value="${escapeHtml(selectedField.tooltip || '')}" onchange="updateFieldProperty('tooltip', this.value)">
                </div>
            ` : ''}
            <div class="form-row">
                <div class="form-group">
                    <label>Prefix</label>
                    <input type="text" id="fieldPrefix" value="${escapeHtml(selectedField.prefix || '')}" onchange="updateFieldProperty('prefix', this.value)">
                </div>
                <div class="form-group">
                    <label>Suffix</label>
                    <input type="text" id="fieldSuffix" value="${escapeHtml(selectedField.suffix || '')}" onchange="updateFieldProperty('suffix', this.value)">
                </div>
            </div>
            <div class="form-group">
                <label>Character Limit</label>
                <input type="number" id="fieldCharLimit" value="${selectedField.charLimit || ''}" min="1" onchange="updateFieldProperty('charLimit', this.value ? parseInt(this.value) : null)">
            </div>
            ${selectedField.charLimit ? `
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldShowCharCounter" ${selectedField.showCharCounter ? 'checked' : ''} onchange="updateFieldProperty('showCharCounter', this.checked)">
                        Show Character Counter
                    </label>
                </div>
            ` : ''}
            <div class="form-group">
                <label>Custom Validation Message</label>
                <input type="text" id="fieldCustomValidationMessage" value="${escapeHtml(selectedField.customValidationMessage || '')}" onchange="updateFieldProperty('customValidationMessage', this.value)">
            </div>
            <div class="form-group">
                <label>Custom CSS Class</label>
                <input type="text" id="fieldCustomClass" value="${escapeHtml(selectedField.customClass || '')}" onchange="updateFieldProperty('customClass', this.value)">
            </div>
            <div class="form-group">
                <label>Field Icon (Font Awesome class)</label>
                <input type="text" id="fieldIcon" value="${escapeHtml(selectedField.icon || '')}" placeholder="e.g., fas fa-user" onchange="updateFieldProperty('icon', this.value)">
            </div>
            <div class="form-group">
                <label>Assign to Section</label>
                <select id="fieldSectionId" onchange="updateFieldProperty('sectionId', this.value || null)">
                    <option value="">No Section</option>
                    ${formData.sections.sort((a, b) => a.order - b.order).map(s => `
                        <option value="${s.id}" ${selectedField.sectionId === s.id ? 'selected' : ''}>${escapeHtml(s.title)}</option>
                    `).join('')}
                </select>
            </div>
            
            ${renderFieldSpecificProperties()}
            ${renderAutoFetchProperties()}
            ${renderConditionalLogicProperties()}
        </div>
    `;
}

/**
 * Render field-specific properties
 */
function renderFieldSpecificProperties() {
    if (!selectedField) return '';

    let html = '<div class="form-section"><h5>Field-Specific Properties</h5>';

    switch (selectedField.type) {
        case 'text':
            html += `
                <div class="form-group">
                    <label>Input Type</label>
                    <select id="fieldInputType" onchange="updateFieldProperty('inputType', this.value)">
                        <option value="text" ${selectedField.inputType === 'text' ? 'selected' : ''}>Text</option>
                        <option value="password" ${selectedField.inputType === 'password' ? 'selected' : ''}>Password</option>
                        <option value="url" ${selectedField.inputType === 'url' ? 'selected' : ''}>URL</option>
                        <option value="tel" ${selectedField.inputType === 'tel' ? 'selected' : ''}>Telephone</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Min Length</label>
                        <input type="number" id="fieldMinLength" value="${selectedField.validation?.minLength || ''}" min="0" onchange="updateFieldValidation('minLength', this.value ? parseInt(this.value) : null)">
                    </div>
                    <div class="form-group">
                        <label>Max Length</label>
                        <input type="number" id="fieldMaxLength" value="${selectedField.validation?.maxLength || ''}" min="0" onchange="updateFieldValidation('maxLength', this.value ? parseInt(this.value) : null)">
                    </div>
                </div>
                <div class="form-group">
                    <label>Auto-Capitalize</label>
                    <select id="fieldAutoCapitalize" onchange="updateFieldProperty('autoCapitalize', this.value)">
                        <option value="none" ${selectedField.autoCapitalize === 'none' ? 'selected' : ''}>None</option>
                        <option value="words" ${selectedField.autoCapitalize === 'words' ? 'selected' : ''}>Words</option>
                        <option value="sentences" ${selectedField.autoCapitalize === 'sentences' ? 'selected' : ''}>Sentences</option>
                        <option value="characters" ${selectedField.autoCapitalize === 'characters' ? 'selected' : ''}>Characters</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Validation Pattern (Regex)</label>
                    <input type="text" id="fieldValidationPattern" value="${escapeHtml(selectedField.validation?.pattern || '')}" placeholder="e.g., [A-Za-z]+" onchange="updateFieldValidation('pattern', this.value)">
                </div>
            `;
            break;

        case 'email':
            html += `
                <div class="form-group">
                    <label>Domain Restriction</label>
                    <input type="text" id="fieldDomainRestriction" value="${escapeHtml(selectedField.domainRestriction || '')}" placeholder="e.g., @company.com" onchange="updateFieldProperty('domainRestriction', this.value)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldAutoFill" ${selectedField.autoFill ? 'checked' : ''} onchange="updateFieldProperty('autoFill', this.checked)">
                        Enable Auto-fill
                    </label>
                </div>
            `;
            break;

        case 'number':
            html += `
                <div class="form-row">
                    <div class="form-group">
                        <label>Min Value</label>
                        <input type="number" id="fieldMin" value="${selectedField.validation?.min || ''}" onchange="updateFieldValidation('min', this.value ? parseFloat(this.value) : null)">
                    </div>
                    <div class="form-group">
                        <label>Max Value</label>
                        <input type="number" id="fieldMax" value="${selectedField.validation?.max || ''}" onchange="updateFieldValidation('max', this.value ? parseFloat(this.value) : null)">
                    </div>
                </div>
                <div class="form-group">
                    <label>Step</label>
                    <input type="number" id="fieldStep" value="${selectedField.step || ''}" step="any" onchange="updateFieldProperty('step', this.value ? parseFloat(this.value) : null)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldAllowDecimals" ${selectedField.allowDecimals !== false ? 'checked' : ''} onchange="updateFieldProperty('allowDecimals', this.checked)">
                        Allow Decimals
                    </label>
                </div>
            `;
            break;

        case 'textarea':
            html += `
                <div class="form-group">
                    <label>Rows / Height</label>
                    <input type="number" id="fieldRows" value="${selectedField.rows || 3}" min="1" onchange="updateFieldProperty('rows', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldResizable" ${selectedField.resizable !== false ? 'checked' : ''} onchange="updateFieldProperty('resizable', this.checked)">
                        Allow Resizing
                    </label>
                </div>
            `;
            break;

        case 'dropdown':
            html += `
            <div class="form-group">
                <label>Options</label>
                <div id="fieldOptionsList">
                    ${(selectedField.options || []).map((opt, idx) => `
                        <div class="option-item">
                            <input type="text" value="${escapeHtml(opt)}" onchange="updateFieldOption(${idx}, this.value)">
                            <button class="btn-icon-sm" onclick="removeFieldOption(${idx})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-secondary" onclick="addFieldOption()">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            </div>
                <div class="form-group">
                    <label>Default Option</label>
                    <select id="fieldDefaultOption" onchange="updateFieldProperty('defaultOption', this.value)">
                        <option value="">None</option>
                        ${(selectedField.options || []).map(opt => `
                            <option value="${escapeHtml(opt)}" ${selectedField.defaultOption === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldAllowOther" ${selectedField.allowOther ? 'checked' : ''} onchange="updateFieldProperty('allowOther', this.checked)">
                        Allow "Other" Option
                    </label>
                </div>
                ${selectedField.allowOther ? `
                    <div class="form-group">
                        <label>"Other" Label</label>
                        <input type="text" id="fieldOtherLabel" value="${escapeHtml(selectedField.otherLabel || 'Other')}" onchange="updateFieldProperty('otherLabel', this.value)">
                    </div>
                ` : ''}
            `;
            break;

        case 'multiselect':
            html += `
                <div class="form-group">
                    <label>Options</label>
                    <div id="fieldOptionsList">
                        ${(selectedField.options || []).map((opt, idx) => `
                            <div class="option-item">
                                <input type="text" value="${escapeHtml(opt)}" onchange="updateFieldOption(${idx}, this.value)">
                                <button class="btn-icon-sm" onclick="removeFieldOption(${idx})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="addFieldOption()">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                </div>
                <div class="form-group">
                    <label>Max Selections</label>
                    <input type="number" id="fieldMaxSelections" value="${selectedField.maxSelections || ''}" min="1" onchange="updateFieldProperty('maxSelections', this.value ? parseInt(this.value) : null)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldSelectAllOption" ${selectedField.selectAllOption ? 'checked' : ''} onchange="updateFieldProperty('selectAllOption', this.checked)">
                        Show "Select All" Option
                    </label>
                </div>
                <div class="form-group">
                    <label>Display Mode</label>
                    <select id="fieldDisplayMode" onchange="updateFieldProperty('displayMode', this.value)">
                        <option value="dropdown" ${selectedField.displayMode === 'dropdown' ? 'selected' : ''}>Dropdown</option>
                        <option value="checklist" ${selectedField.displayMode === 'checklist' ? 'selected' : ''}>Checklist</option>
                    </select>
                </div>
            `;
            break;

        case 'checkbox':
            html += `
                <div class="form-group">
                    <label>Options</label>
                    <div id="fieldOptionsList">
                        ${(selectedField.options || []).map((opt, idx) => `
                            <div class="option-item">
                                <input type="text" value="${escapeHtml(opt)}" onchange="updateFieldOption(${idx}, this.value)">
                                <button class="btn-icon-sm" onclick="removeFieldOption(${idx})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="addFieldOption()">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                </div>
                <div class="form-group">
                    <label>Layout</label>
                    <select id="fieldLayout" onchange="updateFieldProperty('layout', this.value)">
                        <option value="stacked" ${selectedField.layout === 'stacked' ? 'selected' : ''}>Stacked</option>
                        <option value="inline" ${selectedField.layout === 'inline' ? 'selected' : ''}>Inline</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Min Selections</label>
                        <input type="number" id="fieldMinSelections" value="${selectedField.minSelections || ''}" min="0" onchange="updateFieldProperty('minSelections', this.value ? parseInt(this.value) : null)">
                    </div>
                    <div class="form-group">
                        <label>Max Selections</label>
                        <input type="number" id="fieldMaxSelections" value="${selectedField.maxSelections || ''}" min="0" onchange="updateFieldProperty('maxSelections', this.value ? parseInt(this.value) : null)">
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldAllowOther" ${selectedField.allowOther ? 'checked' : ''} onchange="updateFieldProperty('allowOther', this.checked)">
                        Allow "Other" Option
                    </label>
                </div>
                ${selectedField.allowOther ? `
                    <div class="form-group">
                        <label>"Other" Label</label>
                        <input type="text" id="fieldOtherLabel" value="${escapeHtml(selectedField.otherLabel || 'Other')}" onchange="updateFieldProperty('otherLabel', this.value)">
                    </div>
                ` : ''}
            `;
            break;

        case 'radio':
            html += `
                <div class="form-group">
                    <label>Options</label>
                    <div id="fieldOptionsList">
                        ${(selectedField.options || []).map((opt, idx) => `
                            <div class="option-item">
                                <input type="text" value="${escapeHtml(opt)}" onchange="updateFieldOption(${idx}, this.value)">
                                <button class="btn-icon-sm" onclick="removeFieldOption(${idx})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="addFieldOption()">
                        <i class="fas fa-plus"></i> Add Option
                    </button>
                </div>
                <div class="form-group">
                    <label>Default Selection</label>
                    <select id="fieldDefaultSelection" onchange="updateFieldProperty('defaultSelection', this.value)">
                        <option value="">None</option>
                        ${(selectedField.options || []).map(opt => `
                            <option value="${escapeHtml(opt)}" ${selectedField.defaultSelection === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Layout</label>
                    <select id="fieldLayout" onchange="updateFieldProperty('layout', this.value)">
                        <option value="stacked" ${selectedField.layout === 'stacked' ? 'selected' : ''}>Stacked</option>
                        <option value="inline" ${selectedField.layout === 'inline' ? 'selected' : ''}>Inline</option>
                        <option value="button-style" ${selectedField.layout === 'button-style' ? 'selected' : ''}>Button Style</option>
                    </select>
                </div>
            `;
            break;

        case 'date':
            html += `
                <div class="form-group">
                    <label>Date Format</label>
                    <select id="fieldDateFormat" onchange="updateFieldProperty('dateFormat', this.value)">
                        <option value="YYYY-MM-DD" ${selectedField.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                        <option value="DD/MM/YYYY" ${selectedField.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                        <option value="MM-DD-YYYY" ${selectedField.dateFormat === 'MM-DD-YYYY' ? 'selected' : ''}>MM-DD-YYYY</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Min Date</label>
                        <input type="date" id="fieldMinDate" value="${selectedField.minDate || ''}" onchange="updateFieldProperty('minDate', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Max Date</label>
                        <input type="date" id="fieldMaxDate" value="${selectedField.maxDate || ''}" onchange="updateFieldProperty('maxDate', this.value)">
                    </div>
                </div>
                <div class="form-group">
                    <label>Default Date</label>
                    <input type="date" id="fieldDefaultDate" value="${selectedField.defaultDate || ''}" onchange="updateFieldProperty('defaultDate', this.value)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldRangeMode" ${selectedField.rangeMode ? 'checked' : ''} onchange="updateFieldProperty('rangeMode', this.checked)">
                        Range Mode (Start - End Date)
                    </label>
                </div>
            `;
            break;

        case 'time':
            html += `
                <div class="form-group">
                    <label>Time Format</label>
                    <select id="fieldTimeFormat" onchange="updateFieldProperty('timeFormat', this.value)">
                        <option value="24h" ${selectedField.timeFormat === '24h' ? 'selected' : ''}>24 Hour</option>
                        <option value="12h" ${selectedField.timeFormat === '12h' ? 'selected' : ''}>12 Hour</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Step (minutes)</label>
                    <input type="number" id="fieldTimeStep" value="${selectedField.step || 60}" min="1" onchange="updateFieldProperty('step', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldIncludeSeconds" ${selectedField.includeSeconds ? 'checked' : ''} onchange="updateFieldProperty('includeSeconds', this.checked)">
                        Include Seconds
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Min Time</label>
                        <input type="time" id="fieldMinTime" value="${selectedField.minTime || ''}" onchange="updateFieldProperty('minTime', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Max Time</label>
                        <input type="time" id="fieldMaxTime" value="${selectedField.maxTime || ''}" onchange="updateFieldProperty('maxTime', this.value)">
                    </div>
                </div>
            `;
            break;

        case 'rating':
            html += `
                <div class="form-group">
                    <label>Star Count</label>
                    <input type="number" id="fieldStarCount" value="${selectedField.starCount || 5}" min="1" max="10" onchange="updateFieldProperty('starCount', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldAllowHalfRatings" ${selectedField.allowHalfRatings ? 'checked' : ''} onchange="updateFieldProperty('allowHalfRatings', this.checked)">
                        Allow Half Ratings
                    </label>
                </div>
                <div class="form-group">
                    <label>Icon Type</label>
                    <select id="fieldIconType" onchange="updateFieldProperty('iconType', this.value)">
                        <option value="star" ${selectedField.iconType === 'star' ? 'selected' : ''}>Star</option>
                        <option value="heart" ${selectedField.iconType === 'heart' ? 'selected' : ''}>Heart</option>
                        <option value="emoji" ${selectedField.iconType === 'emoji' ? 'selected' : ''}>Emoji</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Color Theme</label>
                    <input type="color" id="fieldColorTheme" value="${selectedField.colorTheme || '#ffc107'}" onchange="updateFieldProperty('colorTheme', this.value)">
                </div>
            `;
            break;

        case 'scale':
            html += `
            <div class="form-row">
                <div class="form-group">
                    <label>Min Value</label>
                        <input type="number" id="fieldMin" value="${selectedField.validation?.min || 1}" onchange="updateFieldValidation('min', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>Max Value</label>
                        <input type="number" id="fieldMax" value="${selectedField.validation?.max || 10}" onchange="updateFieldValidation('max', parseInt(this.value))">
                </div>
            </div>
                <div class="form-group">
                    <label>Step</label>
                    <input type="number" id="fieldStep" value="${selectedField.step || 1}" min="0.1" step="0.1" onchange="updateFieldProperty('step', parseFloat(this.value))">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldShowValueLabel" ${selectedField.showValueLabel !== false ? 'checked' : ''} onchange="updateFieldProperty('showValueLabel', this.checked)">
                        Show Value Label
                    </label>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <input type="color" id="fieldColor" value="${selectedField.color || '#667eea'}" onchange="updateFieldProperty('color', this.value)">
            </div>
        `;
            break;

        case 'pagebreak':
            html += `
                <div class="form-group">
                    <label>Page Title</label>
                    <input type="text" id="fieldPageTitle" value="${escapeHtml(selectedField.pageTitle || '')}" onchange="updateFieldProperty('pageTitle', this.value)">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldShowProgressBar" ${selectedField.showProgressBar !== false ? 'checked' : ''} onchange="updateFieldProperty('showProgressBar', this.checked)">
                        Show Progress Bar
                    </label>
                </div>
                ${selectedField.showProgressBar !== false ? `
                    <div class="form-group">
                        <label>Progress Type</label>
                        <select id="fieldProgressType" onchange="updateFieldProperty('progressType', this.value)">
                            <option value="bar" ${selectedField.progressType === 'bar' ? 'selected' : ''}>Bar</option>
                            <option value="steps" ${selectedField.progressType === 'steps' ? 'selected' : ''}>Steps</option>
                            <option value="dots" ${selectedField.progressType === 'dots' ? 'selected' : ''}>Dots</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Progress Position</label>
                        <select id="fieldProgressPosition" onchange="updateFieldProperty('progressPosition', this.value)">
                            <option value="top" ${selectedField.progressPosition === 'top' ? 'selected' : ''}>Top</option>
                            <option value="bottom" ${selectedField.progressPosition === 'bottom' ? 'selected' : ''}>Bottom</option>
                            <option value="both" ${selectedField.progressPosition === 'both' ? 'selected' : ''}>Both</option>
                        </select>
                    </div>
                ` : ''}
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldShowPageNumber" ${selectedField.showPageNumber !== false ? 'checked' : ''} onchange="updateFieldProperty('showPageNumber', this.checked)">
                        Show Page Number
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Next Button Label</label>
                        <input type="text" id="fieldNextButton" value="${escapeHtml(selectedField.navigationButtons?.next || 'Next →')}" onchange="updateNavigationButton('next', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Previous Button Label</label>
                        <input type="text" id="fieldPrevButton" value="${escapeHtml(selectedField.navigationButtons?.prev || '← Back')}" onchange="updateNavigationButton('prev', this.value)">
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldAutoScroll" ${selectedField.autoScroll !== false ? 'checked' : ''} onchange="updateFieldProperty('autoScroll', this.checked)">
                        Auto-Scroll on Next
                    </label>
                </div>
                <div class="form-group">
                    <label>Validation Mode</label>
                    <select id="fieldValidationMode" onchange="updateFieldProperty('validationMode', this.value)">
                        <option value="page" ${selectedField.validationMode === 'page' ? 'selected' : ''}>Validate Each Page</option>
                        <option value="form" ${selectedField.validationMode === 'form' ? 'selected' : ''}>Validate at End</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="fieldConditionalSkip" ${selectedField.conditionalSkip ? 'checked' : ''} onchange="updateFieldProperty('conditionalSkip', this.checked)">
                        Conditional Skip
                    </label>
                </div>
            `;
            break;
    }

    html += '</div>';
    return html;
}

/**
 * Render auto-fetch properties
 */
function renderAutoFetchProperties() {
    if (!selectedField) return '';

    return `
        <div class="form-section">
            <h5>Auto-fetch User Data</h5>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="autoFetchEnabled" ${selectedField.autoFetch?.enabled ? 'checked' : ''} onchange="toggleAutoFetch(this.checked)">
                    Enable Auto-fetch
                </label>
            </div>
            ${selectedField.autoFetch?.enabled ? `
                <div class="form-group">
                    <label>Field to Fetch</label>
                    <select id="autoFetchField" onchange="updateAutoFetch('field', this.value)">
                        <option value="name" ${selectedField.autoFetch?.field === 'name' ? 'selected' : ''}>Name</option>
                        <option value="email" ${selectedField.autoFetch?.field === 'email' ? 'selected' : ''}>Email</option>
                        <option value="phone" ${selectedField.autoFetch?.field === 'phone' ? 'selected' : ''}>Phone</option>
                        <option value="whatsapp" ${selectedField.autoFetch?.field === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                        <option value="githubUsername" ${selectedField.autoFetch?.field === 'githubUsername' ? 'selected' : ''}>GitHub Username</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Mode</label>
                    <select id="autoFetchMode" onchange="updateAutoFetch('mode', this.value)">
                        <option value="prefilled" ${selectedField.autoFetch?.mode === 'prefilled' ? 'selected' : ''}>Pre-filled (Editable)</option>
                        <option value="readonly" ${selectedField.autoFetch?.mode === 'readonly' ? 'selected' : ''}>Read-only</option>
                        <option value="hidden" ${selectedField.autoFetch?.mode === 'hidden' ? 'selected' : ''}>Hidden</option>
                    </select>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render section properties panel
 */
function renderSectionProperties() {
    if (!selectedSection) return '';

    return `
        <div class="properties-header">
            <h4>Section Properties</h4>
            <button class="btn-icon-sm" onclick="deleteSection('${selectedSection.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="properties-content">
            <div class="form-group">
                <label>Section Title</label>
                <input type="text" id="sectionTitle" value="${escapeHtml(selectedSection.title || '')}" onchange="updateSectionProperty('title', this.value)">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="sectionDescription" rows="3" onchange="updateSectionProperty('description', this.value)">${escapeHtml(selectedSection.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="sectionCollapsible" ${selectedSection.collapsible ? 'checked' : ''} onchange="updateSectionProperty('collapsible', this.checked)">
                    Collapsible
                </label>
            </div>
            ${selectedSection.collapsible ? `
                <div class="form-group">
                    <label>Default State</label>
                    <select id="sectionDefaultState" onchange="updateSectionProperty('defaultState', this.value)">
                        <option value="expanded" ${selectedSection.defaultState === 'expanded' ? 'selected' : ''}>Expanded</option>
                        <option value="collapsed" ${selectedSection.defaultState === 'collapsed' ? 'selected' : ''}>Collapsed</option>
                    </select>
                </div>
            ` : ''}
            <div class="form-group">
                <label>
                    <input type="checkbox" id="sectionDivider" ${selectedSection.divider !== false ? 'checked' : ''} onchange="updateSectionProperty('divider', this.checked)">
                    Show Divider Line
                </label>
            </div>
            <div class="form-group">
                <label>Background Style</label>
                <select id="sectionBackgroundStyle" onchange="updateSectionProperty('backgroundStyle', this.value)">
                    <option value="none" ${selectedSection.backgroundStyle === 'none' ? 'selected' : ''}>None</option>
                    <option value="light" ${selectedSection.backgroundStyle === 'light' ? 'selected' : ''}>Light</option>
                    <option value="card" ${selectedSection.backgroundStyle === 'card' ? 'selected' : ''}>Card</option>
                </select>
            </div>
            <div class="form-group">
                <label>Icon (Font Awesome class)</label>
                <input type="text" id="sectionIcon" value="${escapeHtml(selectedSection.icon || '')}" placeholder="e.g., fas fa-user" onchange="updateSectionProperty('icon', this.value)">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="sectionShowNumber" ${selectedSection.showSectionNumber !== false ? 'checked' : ''} onchange="updateSectionProperty('showSectionNumber', this.checked)">
                    Show Section Number
                </label>
            </div>
        </div>
    `;
}

/**
 * Render conditional logic properties
 */
function renderConditionalLogicProperties() {
    if (!selectedField) return '';

    return `
        <div class="form-section">
            <h5>Conditional Logic</h5>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="conditionalEnabled" ${selectedField.conditionalLogic?.enabled ? 'checked' : ''} onchange="toggleConditionalLogic(this.checked)">
                    Enable Conditional Logic
                </label>
            </div>
            ${selectedField.conditionalLogic?.enabled ? `
                <div id="conditionalConditions">
                    ${(selectedField.conditionalLogic?.conditions || []).map((cond, idx) => `
                        <div class="condition-item">
                            <select onchange="updateCondition(${idx}, 'fieldId', this.value)">
                                ${formData.fields.filter(f => f.id !== selectedField.id).map(f => `
                                    <option value="${f.id}" ${cond.fieldId === f.id ? 'selected' : ''}>${escapeHtml(f.label)}</option>
                                `).join('')}
                            </select>
                            <select onchange="updateCondition(${idx}, 'operator', this.value)">
                                <option value="equals" ${cond.operator === 'equals' ? 'selected' : ''}>Equals</option>
                                <option value="not_equals" ${cond.operator === 'not_equals' ? 'selected' : ''}>Not Equals</option>
                                <option value="contains" ${cond.operator === 'contains' ? 'selected' : ''}>Contains</option>
                            </select>
                            <input type="text" value="${escapeHtml(cond.value || '')}" onchange="updateCondition(${idx}, 'value', this.value)">
                            <select onchange="updateCondition(${idx}, 'action', this.value)">
                                <option value="show" ${cond.action === 'show' ? 'selected' : ''}>Show</option>
                                <option value="hide" ${cond.action === 'hide' ? 'selected' : ''}>Hide</option>
                            </select>
                            <button class="btn-icon-sm" onclick="removeCondition(${idx})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-secondary" onclick="addCondition()">
                    <i class="fas fa-plus"></i> Add Condition
                </button>
            ` : ''}
        </div>
    `;
}

/**
 * Setup builder event listeners
 */
function setupBuilderEventListeners() {
    // Redirect type radio buttons
    const redirectRadios = document.querySelectorAll('input[name="redirectType"]');
    redirectRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const customUrlGroup = document.getElementById('customUrlGroup');
            if (customUrlGroup) {
                customUrlGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
        });
    });

    // Stage indicator clicks
    const stageIndicators = document.querySelectorAll('.stage[data-stage]');
    stageIndicators.forEach(stage => {
        stage.addEventListener('click', () => {
            const stageNum = parseInt(stage.dataset.stage);
            if (stageNum === 1 && currentStage === 2) {
                goToStage1();
            } else if (stageNum === 2 && currentStage === 1) {
                if (validateStage1()) {
                    proceedToStage2();
                }
            }
        });
    });
}

/**
 * Validate Stage 1
 */
function validateStage1() {
    const formName = document.getElementById('formName');
    if (!formName || !formName.value.trim()) {
        alert('Please enter a form name');
        formName?.focus();
        return false;
    }
    return true;
}

/**
 * Save Stage 1 data
 */
function saveStage1Data() {
    const formName = document.getElementById('formName');
    const formDescription = document.getElementById('formDescription');
    const formCategory = document.getElementById('formCategory');
    const formTags = document.getElementById('formTags');
    const formStatus = document.getElementById('formStatus');
    const allowMultiple = document.getElementById('allowMultipleSubmissions');
    const submissionLimit = document.getElementById('submissionLimit');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const redirectType = document.querySelector('input[name="redirectType"]:checked');
    const redirectUrl = document.getElementById('redirectUrl');
    const confirmationMessage = document.getElementById('confirmationMessage');

    formData.name = formName?.value || '';
    formData.description = formDescription?.value || '';
    formData.category = formCategory?.value || '';
    formData.tags = formTags?.value ? formTags.value.split(',').map(t => t.trim()).filter(t => t) : [];
    formData.status = formStatus?.value || 'draft';
    formData.settings.allowMultipleSubmissions = allowMultiple?.checked || false;
    formData.settings.submissionLimit = submissionLimit?.value ? parseInt(submissionLimit.value) : null;
    formData.settings.startDate = startDate?.value ? new Date(startDate.value) : null;
    formData.settings.endDate = endDate?.value ? new Date(endDate.value) : null;
    formData.settings.redirectType = redirectType?.value || 'same-page';
    formData.settings.redirectUrl = redirectUrl?.value || '';
    formData.settings.confirmationMessage = confirmationMessage?.value || 'Thank you for your submission!';
}

/**
 * Proceed to Stage 2
 */
window.proceedToStage2 = function() {
    if (!validateStage1()) return;
    saveStage1Data();
    currentStage = 2;
    renderBuilder();
};

/**
 * Go back to Stage 1
 */
window.goToStage1 = function() {
    currentStage = 1;
    renderBuilder();
};

/**
 * Add field
 */
window.addField = function(type) {
    const fieldId = generateUUID();
    const maxOrder = formData.fields.length > 0 ? Math.max(...formData.fields.map(f => f.order)) : -1;
    
    let newField = {
        id: fieldId,
        type: type,
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
        placeholder: '',
        helpText: '',
        defaultValue: '',
        required: false,
        readonly: false,
        hidden: false,
        width: 12,
        tooltip: '',
        showTooltip: false,
        prefix: '',
        suffix: '',
        charLimit: null,
        showCharCounter: false,
        customValidationMessage: '',
        customClass: '',
        icon: '',
        validation: {},
        conditionalLogic: {
            enabled: false,
            conditions: []
        },
        autoFetch: {
            enabled: false,
            field: 'name',
            mode: 'prefilled'
        },
        order: maxOrder + 1,
        sectionId: null,
        columnWidth: 12
    };

    // Type-specific defaults
    if (type === 'pagebreak') {
        newField = {
            ...newField,
            pageTitle: 'Step 2',
            showProgressBar: true,
            progressType: 'bar',
            progressPosition: 'top',
            showPageNumber: true,
            navigationButtons: {
                next: 'Next →',
                prev: '← Back'
            },
            autoScroll: true,
            validationMode: 'page',
            conditionalSkip: false
        };
    } else if (['dropdown', 'multiselect', 'checkbox', 'radio'].includes(type)) {
        newField.options = ['Option 1', 'Option 2'];
    } else if (type === 'text') {
        newField.inputType = 'text';
        newField.autoCapitalize = 'none';
    } else if (type === 'number') {
        newField.step = 1;
        newField.allowDecimals = true;
        newField.validation = { min: null, max: null };
    } else if (type === 'textarea') {
        newField.rows = 3;
        newField.resizable = true;
    } else if (type === 'date') {
        newField.dateFormat = 'YYYY-MM-DD';
        newField.rangeMode = false;
    } else if (type === 'time') {
        newField.timeFormat = '24h';
        newField.step = 60;
        newField.includeSeconds = false;
    } else if (type === 'rating') {
        newField.starCount = 5;
        newField.allowHalfRatings = false;
        newField.iconType = 'star';
        newField.colorTheme = '#ffc107';
    } else if (type === 'scale') {
        newField.validation = { min: 1, max: 10 };
        newField.step = 1;
        newField.showValueLabel = true;
        newField.color = '#667eea';
    }

    formData.fields.push(newField);
    selectedField = newField;
    selectedSection = null;
    saveHistory();
    updatePreview();
}

/**
 * Select field
 */
window.selectField = function(fieldId) {
    selectedField = formData.fields.find(f => f.id === fieldId);
    selectedSection = null;
    renderBuilder();
};

/**
 * Select section
 */
window.selectSection = function(sectionId) {
    selectedSection = formData.sections.find(s => s.id === sectionId);
    selectedField = null;
    renderBuilder();
};

/**
 * Delete field
 */
window.deleteField = function(fieldId) {
    if (!confirm('Are you sure you want to delete this field?')) return;
    formData.fields = formData.fields.filter(f => f.id !== fieldId);
    if (selectedField?.id === fieldId) {
        selectedField = null;
    }
    saveHistory();
    updatePreview();
};

/**
 * Update field property
 */
window.updateFieldProperty = function(property, value) {
    if (!selectedField) return;
    
    // Preserve properties panel scroll position
    const propertiesContent = document.querySelector('.properties-content');
    const scrollTop = propertiesContent ? propertiesContent.scrollTop : 0;
    
    // Handle sectionId specially - convert empty string to null
    if (property === 'sectionId') {
        selectedField[property] = value === '' || value === null ? null : value;
        // Update sections list to reflect new field count
        const sectionsList = document.getElementById('sectionsList');
        if (sectionsList) {
            sectionsList.innerHTML = renderSectionsList();
        }
    } else {
        selectedField[property] = value;
    }
    
    saveHistory();
    updatePreview();
    
    // Restore scroll position after DOM updates
    if (propertiesContent && scrollTop > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                propertiesContent.scrollTop = scrollTop;
            });
        });
    }
};

/**
 * Update section property
 */
window.updateSectionProperty = function(property, value) {
    if (!selectedSection) return;
    
    // Preserve properties panel scroll position
    const propertiesContent = document.querySelector('.properties-content');
    const scrollTop = propertiesContent ? propertiesContent.scrollTop : 0;
    
    selectedSection[property] = value;
    saveHistory();
    // Update preview to reflect section changes
    updatePreview();
    // Also update sections list
    const sectionsList = document.getElementById('sectionsList');
    if (sectionsList) {
        sectionsList.innerHTML = renderSectionsList();
    }
    
    // Restore scroll position after DOM updates
    if (propertiesContent && scrollTop > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                propertiesContent.scrollTop = scrollTop;
            });
        });
    }
};

/**
 * Update navigation button
 */
window.updateNavigationButton = function(type, value) {
    if (!selectedField || selectedField.type !== 'pagebreak') return;
    
    // Preserve properties panel scroll position
    const propertiesContent = document.querySelector('.properties-content');
    const scrollTop = propertiesContent ? propertiesContent.scrollTop : 0;
    
    if (!selectedField.navigationButtons) {
        selectedField.navigationButtons = { next: 'Next →', prev: '← Back' };
    }
    selectedField.navigationButtons[type] = value;
    saveHistory();
    updatePreview();
    
    // Restore scroll position after DOM updates
    if (propertiesContent && scrollTop > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                propertiesContent.scrollTop = scrollTop;
            });
        });
    }
};

/**
 * Add field option
 */
window.addFieldOption = function() {
    if (!selectedField) return;
    
    // Preserve properties panel scroll position
    const propertiesContent = document.querySelector('.properties-content');
    const scrollTop = propertiesContent ? propertiesContent.scrollTop : 0;
    
    if (!selectedField.options) selectedField.options = [];
    selectedField.options.push('New Option');
    saveHistory();
    renderBuilder();
    
    // Restore scroll position after DOM updates
    if (propertiesContent && scrollTop > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                propertiesContent.scrollTop = scrollTop;
            });
        });
    }
};

/**
 * Update field option
 */
window.updateFieldOption = function(index, value) {
    if (!selectedField || !selectedField.options) return;
    
    // Preserve properties panel scroll position
    const propertiesContent = document.querySelector('.properties-content');
    const scrollTop = propertiesContent ? propertiesContent.scrollTop : 0;
    
    selectedField.options[index] = value;
    saveHistory();
    updatePreview();
    
    // Restore scroll position after DOM updates
    if (propertiesContent && scrollTop > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                propertiesContent.scrollTop = scrollTop;
            });
        });
    }
};

/**
 * Remove field option
 */
window.removeFieldOption = function(index) {
    if (!selectedField || !selectedField.options) return;
    if (!confirm('Are you sure you want to remove this option?')) return;
    
    // Preserve properties panel scroll position
    const propertiesContent = document.querySelector('.properties-content');
    const scrollTop = propertiesContent ? propertiesContent.scrollTop : 0;
    
    selectedField.options.splice(index, 1);
    saveHistory();
    renderBuilder();
    
    // Restore scroll position after DOM updates
    if (propertiesContent && scrollTop > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                propertiesContent.scrollTop = scrollTop;
            });
        });
    }
};

/**
 * Update field validation
 */
window.updateFieldValidation = function(property, value) {
    if (!selectedField) return;
    
    // Preserve properties panel scroll position
    const propertiesContent = document.querySelector('.properties-content');
    const scrollTop = propertiesContent ? propertiesContent.scrollTop : 0;
    
    if (!selectedField.validation) selectedField.validation = {};
    selectedField.validation[property] = value ? (property === 'min' || property === 'max' ? parseInt(value) : value) : undefined;
    saveHistory();
    
    // Restore scroll position after DOM updates
    if (propertiesContent && scrollTop > 0) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                propertiesContent.scrollTop = scrollTop;
            });
        });
    }
};

/**
 * Toggle auto-fetch
 */
window.toggleAutoFetch = function(enabled) {
    if (!selectedField) return;
    if (!selectedField.autoFetch) {
        selectedField.autoFetch = { enabled: false, field: 'name', mode: 'prefilled' };
    }
    selectedField.autoFetch.enabled = enabled;
    saveHistory();
    renderBuilder();
};

/**
 * Update auto-fetch
 */
window.updateAutoFetch = function(property, value) {
    if (!selectedField || !selectedField.autoFetch) return;
    selectedField.autoFetch[property] = value;
    saveHistory();
};

/**
 * Toggle conditional logic
 */
window.toggleConditionalLogic = function(enabled) {
    if (!selectedField) return;
    if (!selectedField.conditionalLogic) {
        selectedField.conditionalLogic = { enabled: false, conditions: [] };
    }
    selectedField.conditionalLogic.enabled = enabled;
    saveHistory();
    renderBuilder();
};

/**
 * Add condition
 */
window.addCondition = function() {
    if (!selectedField || !selectedField.conditionalLogic) return;
    if (!selectedField.conditionalLogic.conditions) {
        selectedField.conditionalLogic.conditions = [];
    }
    selectedField.conditionalLogic.conditions.push({
        fieldId: formData.fields[0]?.id || '',
        operator: 'equals',
        value: '',
        action: 'show'
    });
    saveHistory();
    renderBuilder();
};

/**
 * Update condition
 */
window.updateCondition = function(index, property, value) {
    if (!selectedField || !selectedField.conditionalLogic?.conditions) return;
    selectedField.conditionalLogic.conditions[index][property] = value;
    saveHistory();
};

/**
 * Remove condition
 */
window.removeCondition = function(index) {
    if (!selectedField || !selectedField.conditionalLogic?.conditions) return;
    selectedField.conditionalLogic.conditions.splice(index, 1);
    saveHistory();
    renderBuilder();
};

/**
 * Add section
 */
window.addSection = function() {
    const sectionId = generateUUID();
    const maxOrder = formData.sections.length > 0 ? Math.max(...formData.sections.map(s => s.order)) : -1;
    
    const newSection = {
        id: sectionId,
        title: 'New Section',
        description: '',
        collapsible: false,
        defaultState: 'expanded',
        divider: true,
        backgroundStyle: 'none',
        icon: '',
        showSectionNumber: true,
        order: maxOrder + 1
    };

    formData.sections.push(newSection);
    selectedSection = newSection;
    selectedField = null;
    saveHistory();
    renderBuilder();
};

/**
 * Delete section
 */
window.deleteSection = function(sectionId) {
    if (!confirm('Are you sure you want to delete this section? Fields in this section will be unassigned.')) return;
    formData.sections = formData.sections.filter(s => s.id !== sectionId);
    formData.fields.forEach(f => {
        if (f.sectionId === sectionId) {
            f.sectionId = null;
        }
    });
    if (selectedSection?.id === sectionId) {
        selectedSection = null;
    }
    saveHistory();
    renderBuilder();
};

/**
 * Update preview
 */
function updatePreview() {
    const preview = document.getElementById('formPreview');
    if (preview) {
        // Preserve scroll position
        const scrollTop = preview.scrollTop;
        preview.innerHTML = renderFormPreview();
        // Restore scroll position after DOM is ready
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                preview.scrollTop = scrollTop;
            });
        });
    }
}

/**
 * Save draft
 */
window.saveDraft = async function() {
    try {
        if (currentStage === 1) {
            saveStage1Data();
        }

        if (!formData.name.trim()) {
            alert('Please enter a form name');
            return;
        }

        showLoading();
        const user = getCurrentUser();
        const formDataToSave = {
            ...formData,
            updatedAt: Timestamp.now(),
            createdBy: user?.email || 'admin'
        };

        if (!currentForm) {
            formDataToSave.createdAt = Timestamp.now();
            const formsRef = collection(db, 'forms');
            const newDocRef = doc(formsRef);
            await setDoc(newDocRef, formDataToSave);
            currentForm = newDocRef.id;
            showSuccess('Form saved as draft!');
        } else {
            const formRef = doc(db, 'forms', currentForm);
            await updateDoc(formRef, formDataToSave);
            showSuccess('Form updated!');
        }
    } catch (error) {
        console.error('Error saving form:', error);
        alert('Failed to save form');
    } finally {
        hideLoading();
    }
};

/**
 * Publish form
 */
window.publishForm = async function() {
    if (formData.fields.length === 0) {
        alert('Please add at least one field to the form');
        return;
    }

    if (currentStage === 1) {
        if (!validateStage1()) return;
        saveStage1Data();
    }

    if (!formData.name.trim()) {
        alert('Please enter a form name');
        return;
    }

    try {
        showLoading();
        const user = getCurrentUser();
        const formDataToSave = {
            ...formData,
            status: 'active',
            updatedAt: Timestamp.now(),
            createdBy: user?.email || 'admin'
        };

        if (!currentForm) {
            formDataToSave.createdAt = Timestamp.now();
            const formsRef = collection(db, 'forms');
            const newDocRef = doc(formsRef);
            await setDoc(newDocRef, formDataToSave);
            currentForm = newDocRef.id;
        } else {
            const formRef = doc(db, 'forms', currentForm);
            await updateDoc(formRef, formDataToSave);
        }

        showSuccess('Form published successfully!');
        setTimeout(() => {
            window.location.href = 'forms.html';
        }, 1000);
    } catch (error) {
        console.error('Error publishing form:', error);
        alert('Failed to publish form');
    } finally {
        hideLoading();
    }
};

/**
 * Back to forms
 */
window.backToForms = function() {
    if (confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
        window.location.href = 'forms.html';
    }
};

/**
 * Save history for undo/redo
 */
function saveHistory() {
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.parse(JSON.stringify(formData)));
    historyIndex = history.length - 1;
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }
}

/**
 * Generate UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date time for input
 */
function formatDateTimeLocal(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Show success message
 */
function showSuccess(message) {
    alert(message); // Can be replaced with toast notification
}

