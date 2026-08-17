import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import VideoManager from '../../../components/admin/VideoManager';
import { getVideosAdmin } from '../../../lib/admin-data';
export default async function Videos(){const videos=await getVideosAdmin();return <AdminShell active="Videos"><AdminHeader title="Videos" description="Publish YouTube, Vimeo and external video stories without hosting large video files."/><VideoManager videos={videos}/></AdminShell>}
