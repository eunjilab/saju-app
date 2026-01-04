// Netlify 서버리스 함수 - Notion API 프록시
// 사주 분석 결과를 노션 데이터베이스에 저장

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const notionKey = process.env.NOTION_API_KEY;
  const notionDbId = process.env.NOTION_DATABASE_ID;

  if (!notionKey || !notionDbId) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Notion not configured' })
    };
  }

  try {
    const body = JSON.parse(event.body);

    // 노션 페이지 생성
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: notionDbId },
        properties: {
          '이름': {
            title: [{ text: { content: body.name || '' } }]
          },
          '생년월일': {
            rich_text: [{ text: { content: body.birthDate || '' } }]
          },
          '성별': {
            select: { name: body.gender === 'female' ? '여성' : '남성' }
          },
          'MBTI': {
            select: body.mbti ? { name: body.mbti } : null
          },
          '일간': {
            select: body.saju?.ilgan ? { name: body.saju.ilgan } : null
          },
          '오행': {
            select: body.saju?.ilganElement ? { name: body.saju.ilganElement } : null
          },
          '사주명식': {
            rich_text: [{ text: { content: body.saju?.fullText || '' } }]
          },
          '현재대운': {
            rich_text: [{ text: { content: body.daeun ? `${body.daeun.gan}${body.daeun.ji}` : '' } }]
          },
          '태양별자리': {
            select: body.western?.sun ? { name: body.western.sun } : null
          },
          'E/I 예측': {
            select: body.eiPrediction ? { name: body.eiPrediction } : null
          },
          '분석일': {
            date: { start: new Date().toISOString().split('T')[0] }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Notion API Error:', data);
      throw new Error(data.message || 'Failed to save to Notion');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, pageId: data.id })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
}
