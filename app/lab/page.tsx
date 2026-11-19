import { ownsLab } from "../../lib/owner";
import {Header} from "../../components/Header";import LabBoard from "../../components/LabBoard";import {requireChatGPTUser} from "../chatgpt-auth";
export const dynamic="force-dynamic";
export default async function Lab(){const user=await requireChatGPTUser("/lab");if(!ownsLab(user))return <><Header/><main className="inner"><h1 className="page-title">ACCÈS PRIVÉ</h1><p>Cet atelier appartient au créateur du portfolio.</p></main></>;return <><Header/><LabBoard/></>}
