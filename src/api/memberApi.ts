import { GroupMember, LoginCommand, MemberModel, TokenResponse, UserCreateCommand, UserGroupModel } from '@/types/member';
import { apiClient } from './apiClient';

export const memberApi = {
  // 회원 가입
  register(command: UserCreateCommand): Promise<MemberModel> {
    return apiClient.post<MemberModel>('/api/v1/auth/register', command as unknown as Record<string, unknown>);
  },

  // 로그인
  async login(command: LoginCommand): Promise<TokenResponse> {
    const tokens = await apiClient.post<TokenResponse>('/api/v1/auth/login', command as unknown as Record<string, unknown>);
    if (tokens.accessToken && tokens.refreshToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
    return tokens;
  },

  // 구글 로그인 후 전달받은 일회용 코드(30초 유효, 1회용)를 토큰 세트로 교환
  async exchangeOAuth2Code(code: string): Promise<TokenResponse> {
    const tokens = await apiClient.post<TokenResponse>('/api/v1/auth/oauth2/token', { code });
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    return tokens;
  },

  // 로그아웃
  async logout(): Promise<void> {
    await apiClient.post<void>('/api/v1/auth/logout', {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // 내 소속 그룹 목록 조회
  getMyGroups(): Promise<UserGroupModel[]> {
    return apiClient.get<UserGroupModel[]>('/api/v1/groups/me');
  },

  // 새 그룹 만들기 (만든 사람이 OWNER)
  createGroup(groupName: string, description?: string): Promise<UserGroupModel> {
    const body: Record<string, unknown> = { groupName };
    if (description) body.description = description;
    return apiClient.post<UserGroupModel>('/api/v1/groups', body);
  },

  // 그룹 멤버 목록 (그룹 소속이면 누구나)
  getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return apiClient.get<GroupMember[]>(`/api/v1/groups/${groupId}/members`);
  },

  // 이메일로 멤버 추가 (OWNER만, 가입된 회원을 바로 MEMBER로 추가)
  addGroupMember(groupId: number, email: string): Promise<GroupMember> {
    return apiClient.post<GroupMember>(`/api/v1/groups/${groupId}/members`, { email });
  },

  // 멤버 제거 (OWNER만, OWNER 자신은 제거 불가)
  removeGroupMember(groupId: number, memberId: number): Promise<void> {
    return apiClient.delete<void>(`/api/v1/groups/${groupId}/members/${memberId}`);
  },

  // 그룹 삭제 (OWNER만)
  deleteGroup(groupId: number): Promise<void> {
    return apiClient.delete<void>(`/api/v1/groups/${groupId}`);
  },

  // 회원 단일 조회
  getMemberById(id: number): Promise<MemberModel> {
    return apiClient.get<MemberModel>(`/api/v1/members/${id}`);
  },

  // 내 정보 조회 (Access Token 기준)
  getMe(): Promise<MemberModel> {
    return apiClient.get<MemberModel>('/api/v1/members/me');
  }
};