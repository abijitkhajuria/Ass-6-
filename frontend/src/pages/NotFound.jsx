import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '../components/Primitives'

export default function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That route does not exist in the result portal."
        action={
          <Link to="/" className="btn-primary">
            Back to dashboard
          </Link>
        }
      />
    </div>
  )
}
