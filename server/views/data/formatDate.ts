import { format, parseISO } from 'date-fns'

export default function formatDate(isoDateString: string) {
  const date = parseISO(isoDateString)
  return format(date, "iiii dd MMMM yyyy 'at' HH:mm")
}
