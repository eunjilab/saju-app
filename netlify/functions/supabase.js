// Netlify 서버리스 함수 - Supabase 프록시
// 사주 분석 결과를 안전하게 저장하고 조회

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Supabase not configured' })
    };
  }

  try {
    // GET: 데이터 조회
    if (event.httpMethod === 'GET') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/saju_results?order=created_at.desc&limit=50`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch data');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data })
      };
    }

    // POST: 데이터 저장
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);

      const insertData = {
        name: body.name,
        birth_date: body.birthDate,
        birth_time: body.birthTime,
        gender: body.gender,
        mbti: body.mbti,
        saju: body.saju,
        daeun: body.daeun,
        western: body.western,
        ei_prediction: body.eiPrediction,
        answers: body.answers
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/saju_results`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(insertData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save data');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: data[0] })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
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
