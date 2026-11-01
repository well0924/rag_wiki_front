// 회원 기본 도메인 규격 (MemberModel 대응)
export interface MemberModel {
  userName: string;
  id: number;
  email: string;
  username: string;
  role: string;
  groupIds: number[]; // 유저가 속한 소속 부서/조직 식별자 목록
}

export interface UserCreateCommand {
  email: string;
  password: string;
  userName: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface UserGroupModel {
  id: number;
  groupName: string;
  description: string | null;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}