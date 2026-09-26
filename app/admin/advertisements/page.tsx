import { AdminHeader,AdminShell } from '../../../components/admin/AdminShell';
import AdManager from '../../../components/admin/AdManager';
import { getAdsAdmin } from '../../../lib/admin-data';

export default async function Ads(){
  let data={campaigns:[],slots:[],creatives:[],assignments:[],media:[]};
  let error='';
  try{data=await getAdsAdmin() as typeof data;}
  catch(value){error=value instanceof Error?value.message:'Advertising data could not be loaded.';}
  return <AdminShell active="Advertisements">
    <AdminHeader title="Advertising" description="Create campaigns, upload image or video creatives, and place ads across Webfit News."/>
    {error?<div className="admin-alert" role="alert">{error}</div>:null}
    <AdManager {...data}/>
  </AdminShell>;
}
