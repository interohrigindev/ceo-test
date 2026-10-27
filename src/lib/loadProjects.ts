// 데이터를 읽는 곳은 여기 한 군데. v2에서 API(D1)로 바꿀 때 이 파일만 고친다.
import data from '../data/projects.json'
import type { Project } from './status'

export type ProjectData = {
  source: string
  projects: Project[]
}

export function loadProjects(): ProjectData {
  return data as ProjectData
}
