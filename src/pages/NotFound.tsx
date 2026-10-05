import { EmptyState } from '../components/States'

export default function NotFound() {
  return (
    <EmptyState
      code="404 · Unpredicted path"
      title="Nothing here."
      actions={[
        { to: '/', label: 'Return home', primary: true },
        { to: '/experiment', label: 'Start the experiment' },
      ]}
    >
      <p>Even the algorithm didn’t see this one coming. The page you were looking for doesn’t exist.</p>
    </EmptyState>
  )
}
