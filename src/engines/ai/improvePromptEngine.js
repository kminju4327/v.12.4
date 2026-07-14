// ============================================================
// AI 섹션 개선 프롬프트 엔진 (수정판)
// ============================================================
// 사용자 instruction을 실제로 반영하는 텍스트 프롬프트로 변환
// ============================================================

export function buildImprovePrompt({
  section = {},
  productInfo = {},
  category = "",
  targetCustomer = "",
  brainKnowledge = {},
  tone = "",
  instruction = ""
}) {
  // 프롬프트 구조를 텍스트로 변환
  const sectionTitle = section.title || "제목 없음";
  const sectionBody = section.body || "본문 없음";
  const sectionItems = Array.isArray(section.items) ? section.items : [];
  
  const productName = productInfo.name || "제품";
  const productBenefits = productInfo.benefits || "건강 관리";
  const productCategory = category || "일반 식품";
  
  const instructionType = determineInstructionType(instruction);
  
  // 각 instruction 유형에 따른 프롬프트 생성
  const instructionBlock = buildInstructionBlock(instructionType, instruction);
  
  const textPrompt = `
당신은 이커머스 제품 상세페이지의 섹션을 개선하는 전문 카피라이터입니다.

=====================================================
[현재 섹션 정보]
=====================================================

제목: ${sectionTitle}

본문:
${sectionBody}

핵심 포인트:
${sectionItems.length > 0 ? sectionItems.map((item, i) => `${i + 1}. ${item}`).join("\n") : "없음"}

=====================================================
[제품 & 카테고리 정보]
=====================================================

제품명: ${productName}
제품 설명: ${productBenefits}
카테고리: ${productCategory}
타겟 고객: ${targetCustomer || "기본"}
제품 톤: ${tone || "신뢰감 있는"}

=====================================================
[사용자 개선 요청]
=====================================================

사용자 요청: "${instruction}"

${instructionBlock}

=====================================================
[개선 규칙]
=====================================================

1. 기존 의도 유지
   - 제품의 핵심 메시지를 바꾸지 마세요
   - 설득 논리의 순서는 유지하세요

2. 요청 방향 100% 반영
   - 사용자의 개선 요청을 명확히 따르세요
   - 요청이 애매하면 보수적으로 해석하세요

3. 한국어 품질
   - 자연스러운 한국어 사용
   - 문법 오류 없음
   - 조사, 띄어쓰기 완벽

4. 길이 관리
   - 제목: 한 줄 (10-15글자)
   - 본문: 2-3 문단 (70-150글자)
   - 핵심 포인트: 3-5개

5. 구조 유지
   - 기존 단락 구조 참고
   - 리스트 형식 유지 (있으면)

=====================================================
[출력 형식]
=====================================================

반드시 JSON 형식으로만 응답하세요:

{
  "title": "개선된 제목",
  "body": "개선된 본문 (여러 문단 가능)",
  "items": ["항목1", "항목2", "항목3"],
  "improvement_reason": "이렇게 개선한 이유"
}

주의:
- 다른 텍스트는 절대 추가하지 말 것
- 따옴표, 줄바꿈 등 JSON 규칙 준수
- body는 '\\n'으로 문단 구분
`;

  return textPrompt;
}

// 사용자 요청 유형 분류
function determineInstructionType(instruction) {
  if (!instruction) return "none";
  
  const lower = instruction.toLowerCase();
  
  // 단어 기반 분류
  if (lower.includes("짧") || lower.includes("간단") || lower.includes("간결")) {
    return "shorter";
  }
  if (lower.includes("길") || lower.includes("자세")) {
    return "longer";
  }
  if (lower.includes("전문") || lower.includes("전담") || lower.includes("신뢰")) {
    return "professional";
  }
  if (lower.includes("프리미") || lower.includes("럭셔") || lower.includes("고급") || lower.includes("우아")) {
    return "premium";
  }
  if (lower.includes("전환") || lower.includes("구매") || lower.includes("설득") || lower.includes("선택")) {
    return "conversion";
  }
  if (lower.includes("감정") || lower.includes("공감") || lower.includes("따뜻") || lower.includes("따뜻")) {
    return "emotional";
  }
  if (lower.includes("쉬") || lower.includes("친근") || lower.includes("일상")) {
    return "casual";
  }
  
  return "custom";
}

// 각 instruction 유형별 상세 가이드 생성
function buildInstructionBlock(instructionType, instruction) {
  const blocks = {
    shorter: `
[짧게 개선하기]
요청: "${instruction}"
목표: 
  - 전체 길이를 70-80% 수준으로 축소
  - 핵심 메시지만 남기기
  - 불필요한 수식어 제거
  - 문장 단순화

예시:
  Before: "이 제품은 고품질의 원료로 만들어졌으며, 엄격한 품질 관리를 통해 안전성을 보장합니다."
  After: "고품질 원료, 엄격한 품질 관리."
`,
    longer: `
[길게 개선하기]
요청: "${instruction}"
목표:
  - 설득력 있는 상세 설명 추가
  - 고객의 우려사항에 대한 답변 추가
  - 제품의 강점을 더 자세히 설명
  - 구체적인 예시나 배경 추가

확장 영역:
  - 왜 이런 원료를 선택했는지?
  - 어떻게 품질을 관리하는지?
  - 고객이 느낄 변화는?
`,
    professional: `
[전문적으로 개선하기]
요청: "${instruction}"
목표:
  - 전문가 톤 적용 (의학, 과학적 근거)
  - 신뢰감 있는 표현 사용
  - 구체적인 수치나 기준 포함
  - 권위 있는 표현

표현 방식:
  × "좋은" → ✓ "검증된"
  × "효과가 있다" → ✓ "임상 데이터에 따르면"
  × "많은 사람들이" → ✓ "사용자 만족도 95%"
  × "도움이 된다" → ✓ "개선 효과를 보인다"

어조: 차분하고 신뢰감 있으며 객관적
`,
    premium: `
[프리미엄 톤으로 개선하기]
요청: "${instruction}"
목표:
  - 럭셔리 브랜드 이미지 강조
  - 고급스러운 표현 사용
  - 선택의 가치와 특별함 강조
  - 부자연스럽지 않은 고급스러움

표현 방식:
  × "좋다" → ✓ "정교하다", "세련되다", "품격 있다"
  × "쓰다" → ✓ "경험하다", "향유하다"
  × "느껴진다" → ✓ "감지되다", "은은하게 전해진다"
  × "비싸다" → ✓ "투자 가치가 있다"

어조: 우아하고 신뢰감 있으며 차별화된
분위기: 선택받은 고객을 위한 프리미엄 제품
`,
    conversion: `
[구매 전환형으로 개선하기]
요청: "${instruction}"
목표:
  - 구매 결정의 이유를 명확히
  - 고객의 선택 포인트 강조
  - 지금 구매해야 하는 이유 제시
  - 행동 유도 표현

개선 포인트:
  1. 선택 이유: "왜 이 제품을 선택해야 하나?"
  2. 차별점: "다른 제품과 뭐가 다른가?"
  3. 신뢰: "정말 믿을 수 있는가?"
  4. 긴급성: "지금 구매하지 않으면 후회한다"
  5. 행동: "클릭해서 결제하고 싶어진다"

표현 방식:
  × "좋은 제품입니다" → ✓ "선택받은 고객들의 리피트 제품입니다"
  × "효과가 있습니다" → ✓ "90일 만에 변화를 체감하세요"
  × "추천합니다" → ✓ "지금 선택하면 특별한 혜택을 받습니다"

어조: 확신 있고 설득력 있으며 긍정적
`,
    emotional: `
[감정적으로 개선하기]
요청: "${instruction}"
목표:
  - 고객의 감정에 호소
  - 공감과 위로 전달
  - 감정적 연결 형성
  - 따뜻한 톤

표현 방식:
  × "제품 설명" → ✓ "당신의 이야기에 공감하며"
  × "효능" → ✓ "당신의 변화"
  × "사용" → ✓ "함께하기", "누리기"

어조: 따뜻하고 공감하며 위로하는
`,
    casual: `
[친근하고 일상적으로 개선하기]
요청: "${instruction}"
목표:
  - 딱딱한 표현 제거
  - 일상 언어로 전환
  - 친근한 톤 형성
  - 쉽게 이해되는 표현

표현 방식:
  × "섭취하다" → ✓ "먹다", "챙기다"
  × "효능" → ✓ "도움", "느낌"
  × "권장" → ✓ "추천", "좋아"
  × "자격" → ✓ "자격 있어"

어조: 친구가 대하는 것처럼 편하고 따뜻한
`,
    custom: `
[사용자 정의 요청]
요청: "${instruction}"

위 요청을 명시적으로 따르세요.
요청이 애매하면 보수적으로 해석하되,
어떻게든 요청의 방향을 100% 반영하세요.
`
  };
  
  return blocks[instructionType] || blocks.custom;
}
