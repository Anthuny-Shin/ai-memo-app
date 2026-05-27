import nextConfig from 'eslint-config-next'

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // React Compiler 규칙: hydration 감지(setMounted), 폼 초기화, 상태 리셋 등
      // 정당한 패턴에서도 발생하므로 warning으로 하향
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]

export default eslintConfig
