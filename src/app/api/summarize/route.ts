export const runtime = 'nodejs'

import { GoogleGenAI } from '@google/genai'
import { NextRequest } from 'next/server'

interface SummarizeRequestBody {
  title: string
  content: string
}

interface SummarizeSuccessResponse {
  summary: string
}

interface SummarizeErrorResponse {
  error: string
}

export async function POST(
  request: NextRequest
): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const body: SummarizeErrorResponse = {
      error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. .env.local 파일에 키를 입력해주세요.',
    }
    return Response.json(body, { status: 500 })
  }

  let body: SummarizeRequestBody
  try {
    body = (await request.json()) as SummarizeRequestBody
  } catch {
    const errorBody: SummarizeErrorResponse = { error: '요청 본문을 파싱할 수 없습니다.' }
    return Response.json(errorBody, { status: 400 })
  }

  const { title, content } = body

  if (!content || content.trim().length === 0) {
    const errorBody: SummarizeErrorResponse = { error: '요약할 내용이 없습니다.' }
    return Response.json(errorBody, { status: 400 })
  }

  const prompt = `다음 메모를 한국어로 간결하게 요약하세요. 핵심 내용을 3~5문장으로 정리하고, 중요한 항목이나 포인트가 있으면 짧게 나열해 주세요. 요약문만 출력하고 서론이나 부가 설명은 생략하세요.

제목: ${title ?? '(제목 없음)'}
본문:
${content}`

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })

    const successBody: SummarizeSuccessResponse = { summary: response.text ?? '' }
    return Response.json(successBody)
  } catch (error) {
    console.error('Gemini API 호출 실패:', error)
    const errorBody: SummarizeErrorResponse = {
      error: 'AI 요약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
    }
    return Response.json(errorBody, { status: 502 })
  }
}
