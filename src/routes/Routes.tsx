import {Routes as ReactDomRoutes, Route} from 'react-router-dom';
import { Calendar } from '@/components/Calendar';
import { MyFocusView } from '@/components/My-focus';
import { TasksView } from '@/components/Task';
import { NotesView } from '@/components/Notes';

function Routes(){
  return(
    <ReactDomRoutes>
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/my-focus" element={<MyFocusView />} />
      <Route path="/tasks" element={<TasksView />} />
      <Route path="/notes" element={<NotesView />} />
    </ReactDomRoutes>
  )
}

export default Routes;