import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import Dashboard from './pages/Dashboard'
import StudentList from './pages/StudentList'
import MarksEntry from './pages/MarksEntry'
import Marksheet from './pages/Marksheet'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/marks" element={<MarksEntry />} />
        <Route path="/marks/:prn" element={<MarksEntry />} />
        <Route path="/marksheet" element={<Marksheet />} />
        <Route path="/marksheet/:prn" element={<Marksheet />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  )
}
