'line spacing: 1.25';

import { LoginCommand, MemberModel, TokenResponse, UserCreateCommand, UserGroupModel } from '@/types/member';
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

  // 새 워크스페이스 그룹 개설
  createGroup(groupName: string, description?: string): Promise<UserGroupModel> {
    const body: Record<string, unknown> = { groupName };
    if (description) body.description = description;
    return apiClient.post<UserGroupModel>('/api/v1/groups', body);
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