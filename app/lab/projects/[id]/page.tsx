import { ownsLab } from "../../../../lib/owner";
import {Header} from "../../../../components/Header";import ProjectEditor from "../../../../components/ProjectEditor";import {requireChatGPTUser} from "../../../chatgpt-auth";
export const dynamic="force-dynamic";
export default async function LabDetail({params}:{params:Promise<{id:string}>}){const user=await requireChatGPTUser("/lab");if(!ownsLab(user))return <><Header/><main className="inner">Accès privé.</main></>;const {id}=await params;return <><Header/><ProjectEditor id={id}/></>}
