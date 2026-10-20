import { ToggleGroup } from 'radix-ui'
import { cn } from '@/lib/cn'

interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      // Radix sends "" when the active item is pressed again; a segmented control always has a value.
      onValueChange={(next) => next && onChange(next as T)}
      className={cn(
        'inline-flex rounded-md border border-border-strong bg-surface-1 p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            'min-h-11 rounded-sm px-3 text-sm font-medium whitespace-nowrap text-fg-muted transition-colors duration-150 ease-out',
            'hover:text-fg data-[state=on]:bg-surface-3 data-[state=on]:text-fg',
          )}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
