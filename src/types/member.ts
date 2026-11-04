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

// 그룹 안에서의 역할 (OWNER: 만든 사람, 그룹 수정·삭제와 멤버 추가·제거 가능)
export type GroupRole = 'OWNER' | 'MEMBER';

// 그룹 멤버 목록 응답 (GroupMemberResponse 대응)
export interface GroupMember {
  memberId: number;
  email: string;
  userName: string | null;
  role: GroupRole;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}