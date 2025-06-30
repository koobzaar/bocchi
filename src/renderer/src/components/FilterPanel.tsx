import React from 'react'
import { useAtom } from 'jotai'
import { filterPanelExpandedAtom } from '../store/atoms'

export type SortOption = 'name-asc' | 'name-desc' | 'skin-asc' | 'skin-desc' | 'champion'
export type DownloadFilter = 'all' | 'downloaded' | 'not-downloaded'
export type ChromaFilter = 'all' | 'has-chromas' | 'no-chromas'

export interface FilterOptions {
  downloadStatus: DownloadFilter
  chromaStatus: ChromaFilter
  championTags: string[]
  sortBy: SortOption
}

interface FilterPanelProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableTags: string[]
  downloadedCount: number
  totalCount: number
  onClearFilters: () => void
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  availableTags,
  downloadedCount,
  totalCount,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useAtom(filterPanelExpandedAtom)

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.championTags.includes(tag)
      ? filters.championTags.filter((t) => t !== tag)
      : [...filters.championTags, tag]
    updateFilter('championTags', newTags)
  }

  const hasActiveFilters =
    filters.downloadStatus !== 'all' ||
    filters.chromaStatus !== 'all' ||
    filters.championTags.length > 0 ||
    filters.sortBy !== 'name-asc'

  return (
    <div className="bg-white dark:bg-charcoal-900 border-b-2 border-charcoal-200 dark:border-charcoal-800 transition-all duration-300">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-charcoal-700 dark:text-charcoal-200 hover:text-charcoal-900 dark:hover:text-charcoal-50 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <span>Filters & Sort</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-terracotta-500 text-white text-xs rounded-full">
                Active
              </span>
            )}
          </button>

          <div className="flex items-center gap-4 text-sm text-charcoal-600 dark:text-charcoal-400">
            <span>
              {downloadedCount} / {totalCount} downloaded
            </span>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-terracotta-600 dark:text-terracotta-400 hover:text-terracotta-700 dark:hover:text-terracotta-300 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 space-y-6 animate-slide-down">
            {/* Download Status */}
            <div>
              <h3 className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-3">
                Download Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {(['all', 'downloaded', 'not-downloaded'] as DownloadFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateFilter('downloadStatus', status)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      filters.downloadStatus === status
                        ? 'bg-terracotta-500 text-white shadow-sm'
                        : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-cream-200 dark:hover:bg-charcoal-700'
                    }`}
                  >
                    {status === 'all'
                      ? 'All'
                      : status === 'downloaded'
                        ? 'Downloaded'
                        : 'Not Downloaded'}
                  </button>
                ))}
              </div>
            </div>

            {/* Chroma Status */}
            <div>
              <h3 className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-3">
                Chromas
              </h3>
              <div className="flex flex-wrap gap-2">
                {(['all', 'has-chromas', 'no-chromas'] as ChromaFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateFilter('chromaStatus', status)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      filters.chromaStatus === status
                        ? 'bg-terracotta-500 text-white shadow-sm'
                        : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-cream-200 dark:hover:bg-charcoal-700'
                    }`}
                  >
                    {status === 'all'
                      ? 'All'
                      : status === 'has-chromas'
                        ? 'Has Chromas'
                        : 'No Chromas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Champion Tags */}
            <div>
              <h3 className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-3">
                Champion Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      filters.championTags.includes(tag)
                        ? 'bg-terracotta-500 text-white shadow-sm'
                        : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-cream-200 dark:hover:bg-charcoal-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-3">
                Sort By
              </h3>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
                  className="px-4 py-2 text-sm bg-cream-100 dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-lg text-charcoal-700 dark:text-charcoal-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="skin-asc">Skin # (Low to High)</option>
                  <option value="skin-desc">Skin # (High to Low)</option>
                  <option value="champion">Champion Name</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
