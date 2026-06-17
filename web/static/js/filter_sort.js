/**
 * Mindloop Client-Side Filtering & Sorting Controller
 * Automatically handles search, drop-down filtering, and sorting in the DOM.
 */

(function () {
    'use strict';

    // Debounce helper
    function debounce(fn, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Initialize all filter-sort bars on the page
    function initAllFilterSortBars() {
        const bars = document.querySelectorAll('.filter-sort-bar');
        bars.forEach(bar => {
            if (bar.dataset.initialized) return;
            setupFilterSortBar(bar);
            bar.dataset.initialized = 'true';
        });
    }

    function setupFilterSortBar(bar) {
        const targetSelector = bar.dataset.target;
        if (!targetSelector) return;

        const container = document.querySelector(targetSelector);
        if (!container) return;

        const searchInput = bar.querySelector('.search-input');
        const filterSelects = bar.querySelectorAll('.filter-select');
        const sortSelect = bar.querySelector('.sort-select');

        // Keep track of the original DOM order for "custom" or default sorting
        // Store references to the elements in their initial order
        const originalElements = Array.from(container.children).filter(el => {
            return !el.classList.contains('empty-state') && el.id !== 'filter-empty-state';
        });

        // Dynamically populate filter select choices from data attributes
        filterSelects.forEach(select => {
            const key = select.dataset.filterKey;
            if (select.dataset.dynamic === 'true' && key) {
                const uniqueValues = new Set();
                originalElements.forEach(el => {
                    const val = el.dataset[key];
                    if (val) {
                        val.split(',').map(v => v.trim()).forEach(v => {
                            if (v) uniqueValues.add(v);
                        });
                    }
                });
                
                const firstOption = select.options[0];
                select.innerHTML = '';
                if (firstOption) select.appendChild(firstOption);
                
                Array.from(uniqueValues).sort().forEach(val => {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    select.appendChild(opt);
                });
            }
        });

        // Search handler
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                applyFiltersAndSort(container, bar, originalElements);
            }, 150));
        }

        // Dropdown filters handler
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                applyFiltersAndSort(container, bar, originalElements);
            });
        });

        // Segmented controls handler (used in tasks.html)
        const segmentedBtns = bar.querySelectorAll('.segmented-btn');
        const barId = bar.id || 'default';
        const savedSegment = sessionStorage.getItem(barId + '-active-segment') || bar.dataset.activeSegment;
        
        if (savedSegment && barId !== 'default') {
            bar.dataset.activeSegment = savedSegment;
            segmentedBtns.forEach(btn => {
                if (btn.dataset.filter === savedSegment) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        segmentedBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                segmentedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                bar.dataset.activeSegment = btn.dataset.filter;
                if (barId !== 'default') {
                    sessionStorage.setItem(barId + '-active-segment', btn.dataset.filter);
                }
                applyFiltersAndSort(container, bar, originalElements);
            });
        });

        // Sort handler
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                applyFiltersAndSort(container, bar, originalElements);
            });
        }

        // Initial run
        applyFiltersAndSort(container, bar, originalElements);
    }

    function applyFiltersAndSort(container, bar, originalElements) {
        const searchInput = bar.querySelector('.search-input');
        const filterSelects = bar.querySelectorAll('.filter-select');
        const sortSelect = bar.querySelector('.sort-select');

        const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const segmentFilter = bar.dataset.activeSegment || '';

        // Collect all filter selections
        const activeFilters = [];
        filterSelects.forEach(select => {
            const key = select.dataset.filterKey;
            const val = select.value;
            if (key && val) {
                activeFilters.push({ key, val });
            }
        });

        // Collect matching items
        const items = Array.from(container.children).filter(el => {
            return !el.classList.contains('empty-state') && el.id !== 'filter-empty-state';
        });

        let visibleCount = 0;

        items.forEach(item => {
            let matchesSearch = true;
            let matchesSegment = true;
            let matchesSelects = true;

            // 1. Search filter
            if (searchQuery) {
                const searchableText = item.dataset.searchable || item.textContent;
                matchesSearch = searchableText.toLowerCase().includes(searchQuery);
            }

            // 2. Segmented filter (e.g. To-Do, Completed, All status filter on Tasks)
            if (segmentFilter && segmentFilter !== 'all') {
                const status = item.dataset.status || '';
                matchesSegment = (status === segmentFilter);
            }

            // 3. Dropdown filters
            for (let filter of activeFilters) {
                const itemVal = item.dataset[filter.key];
                
                // Custom checking for duration ranges
                if (filter.key === 'duration') {
                    if (!itemVal) {
                        matchesSelects = false;
                        break;
                    }
                    const mins = parseFloat(itemVal);
                    if (isNaN(mins)) {
                        matchesSelects = false;
                        break;
                    }
                    if (filter.val === 'short' && mins >= 25) {
                        matchesSelects = false;
                        break;
                    }
                    if (filter.val === 'pomodoro' && (mins < 25 || mins > 50)) {
                        matchesSelects = false;
                        break;
                    }
                    if (filter.val === 'long' && mins <= 50) {
                        matchesSelects = false;
                        break;
                    }
                    continue; // Skip standard equality checks
                }
                
                if (filter.val === 'standalone') {
                    if (itemVal && itemVal.trim() !== '') {
                        matchesSelects = false;
                        break;
                    }
                    continue; // Standalone matched successfully, skip standard checks
                } else if (!itemVal) {
                    matchesSelects = false;
                    break;
                }
                
                // Support multiple tags check if dataset value is comma-separated
                if (filter.key === 'labels' || (itemVal && itemVal.includes(','))) {
                    const tags = itemVal.split(',').map(t => t.trim().toLowerCase());
                    if (!tags.includes(filter.val.toLowerCase())) {
                        matchesSelects = false;
                        break;
                    }
                } else {
                    if (itemVal.toLowerCase() !== filter.val.toLowerCase()) {
                        matchesSelects = false;
                        break;
                    }
                }
            }

            // Show or hide based on all filters matching
            if (matchesSearch && matchesSegment && matchesSelects) {
                item.classList.remove('filter-item-hidden');
                visibleCount++;
            } else {
                item.classList.add('filter-item-hidden');
            }
        });

        // 4. Sort logic
        if (sortSelect && sortSelect.value) {
            const sortVal = sortSelect.value;
            
            // Toggle drag-and-drop indicator class
            if (sortVal !== 'custom') {
                container.classList.add('filter-sort-bar-active-sort');
            } else {
                container.classList.remove('filter-sort-bar-active-sort');
            }

            if (sortVal === 'custom') {
                // Restore original order (append them back in their original sequence)
                originalElements.forEach(el => {
                    if (el.parentNode === container) {
                        container.appendChild(el);
                    }
                });
            } else {
                const [sortKey, sortDir] = sortVal.split('-');
                const sortedItems = items.sort((a, b) => {
                    let valA = a.dataset[sortKey] || '';
                    let valB = b.dataset[sortKey] || '';

                    // Try to parse numbers or dates
                    const numA = parseFloat(valA);
                    const numB = parseFloat(valB);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return sortDir === 'asc' ? numA - numB : numB - numA;
                    }

                    // Try parsing dates
                    const dateA = Date.parse(valA);
                    const dateB = Date.parse(valB);
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
                    }

                    // Standard string comparison
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
                    return 0;
                });

                // Re-append items in sorted order
                sortedItems.forEach(el => container.appendChild(el));
            }
        }

        // Show/hide empty state
        const emptyState = container.querySelector('#filter-empty-state');
        if (emptyState) {
            if (visibleCount === 0 && items.length > 0) {
                emptyState.style.display = 'flex';
                
                // Configure empty state labels
                const titleEl = emptyState.querySelector('#filter-empty-title') || emptyState.querySelector('h3');
                const descEl = emptyState.querySelector('#filter-empty-desc') || emptyState.querySelector('p');
                const iconEl = emptyState.querySelector('#filter-empty-icon') || emptyState.querySelector('.empty-icon');
                
                if (titleEl) titleEl.textContent = 'No matching items found';
                if (descEl) descEl.textContent = 'Try adjusting your search query or filter options.';
                if (iconEl) {
                    iconEl.innerHTML = '<i data-lucide="search-x" style="width: 48px; height: 48px; color: var(--text-light);"></i>';
                    if (window.lucide) window.lucide.createIcons();
                }
            } else {
                emptyState.style.display = 'none';
            }
        }
    }

    // Watch for HTMX swaps to re-initialize and apply filters
    document.body.addEventListener('htmx:afterSwap', function (evt) {
        // Find if the swapped content is or contains a filter-sort-bar or its target container
        const targetContainer = evt.detail.target;
        
        // Find if target container is inside an active filter-sort bar target
        const activeBars = document.querySelectorAll('.filter-sort-bar');
        activeBars.forEach(bar => {
            const targetSelector = bar.dataset.target;
            const container = document.querySelector(targetSelector);
            if (container && (container === targetContainer || container.contains(targetContainer))) {
                // Re-read original element list
                const originalElements = Array.from(container.children).filter(el => {
                    return !el.classList.contains('empty-state') && el.id !== 'filter-empty-state';
                });
                applyFiltersAndSort(container, bar, originalElements);
            }
        });
        
        // Re-init any new filter bars
        initAllFilterSortBars();
    });

    // Page Load Initializer
    document.addEventListener('DOMContentLoaded', () => {
        initAllFilterSortBars();
    });
})();
