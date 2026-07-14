import React, { useEffect, useMemo, useState } from "react";
import { loadProjects, PROJECT_SAVED_EVENT } from "../engines/v11/projectStorageEngine.js";

const TONE_PRESETS = [
  ["premium", "더 프리미엄하게"],
  ["clear", "더 간결하고 명확하게"],
  ["warm", "더 친근하고 따뜻하게"],
  ["expert", "더 전문적이고 신뢰감 있게"],
  ["conversion", "구매 설득력을 높여서"],
];

function readProjects() {
  return loadProjects();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sectionKey(index) {
  return index === "hero" ? "hero" : `section-${index}`;
}

function sectionDisplayName(section, index) {
  if (index === "hero") return "Hero";
  return section?.title || section?.type || `섹션 ${Number(index) + 1}`;
}

export default function ServiceExperiencePanel({
  showPreview = false,
  draft = null,
  onDraftChange,
  onRegenerate,
  onLoadProject,
  onEditSection,
  onAIImproveRequest,
  regeneratingIndex = null,
}) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState(() => readProjects());
  const [tab, setTab] = useState("projects");
  const [editing, setEditing] = useState(null);
  const [aiPreview, setAiPreview] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [histories, setHistories] = useState({});
  const [notice, setNotice] = useState("");

  // ✅ 수정: localStorage 변화 감시 (프로젝트 저장 시 자동 반영)
  useEffect(() => {
    const handleStorageChange = () => {
      setProjects(readProjects());
    };

    // 1초마다 localStorage 확인 (저장 감지용)
    const interval = setInterval(handleStorageChange, 1000);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(PROJECT_SAVED_EVENT, handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(PROJECT_SAVED_EVENT, handleStorageChange);
    };
  }, []);


  const previewRows = useMemo(() => {
    if (!draft) return [];
    return [
      {
        key: "hero",
        index: "hero",
        label: "Hero",
        title: draft.hero_headline || "Hero 제목",
        body: draft.hero_subcopy || "",
      },
      ...(draft.sections || []).map((section, index) => ({
        key: sectionKey(index),
        index,
        label: sectionDisplayName(section, index),
        title: section.title || "",
        body: section.body || "",
        items: Array.isArray(section.items) ? section.items : [],
        type: section.type,
      })),
    ];
  }, [draft]);

  function refreshProjects() {
    setProjects(readProjects());
  }

  function remember(index) {
    if (!draft) return;
    const key = sectionKey(index);
    const snapshot =
      index === "hero"
        ? { hero_headline: draft.hero_headline || "", hero_subcopy: draft.hero_subcopy || "" }
        : clone(draft.sections?.[index] || {});
    setHistories((current) => ({
      ...current,
      [key]: [snapshot, ...(current[key] || [])].slice(0, 8),
    }));
  }

  function openEditor(row) {
    setEditing({
      ...row,
      title: row.title || "",
      body: row.body || "",
      itemsText: (row.items || []).join("\n"),
    });
    setFeedback("");
  }

  function saveEdit() {
    if (!editing || !draft || typeof onDraftChange !== "function") return;
    remember(editing.index);

    if (editing.index === "hero") {
      const updatedDraft = {
        ...draft,
        hero_headline: editing.title.trim(),
        hero_subcopy: editing.body.trim(),
      };
      onDraftChange(updatedDraft);
      if (typeof onEditSection === "function") {
        onEditSection("hero", {
          title: editing.title.trim(),
          body: editing.body.trim(),
          items: [],
        });
      }
    } else {
      const sections = [...(draft.sections || [])];
      const current = sections[editing.index] || {};
      const next = {
        ...current,
        title: editing.title.trim(),
        body: editing.body.trim(),
      };
      if (Array.isArray(current.items)) {
        next.items = editing.itemsText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      sections[editing.index] = next;
      const updatedDraft = { ...draft, sections };
      onDraftChange(updatedDraft);
      if (typeof onEditSection === "function") {
        onEditSection(editing.index, {
          title: next.title,
          body: next.body,
          items: next.items || [],
        });
      }
    }

    setEditing(null);
    setNotice("수정 내용이 상세페이지에 반영되었습니다.");
    setTimeout(() => setNotice(""), 2200);
  }

  async function regenerate(index, instruction = "") {
    if (typeof onRegenerate !== "function") return;
    remember(index);
    await onRegenerate(index, instruction.trim());
    setFeedback("");
    setNotice("해당 섹션을 다시 생성했습니다.");
    setTimeout(() => setNotice(""), 2200);
  }

  function restoreVersion(index, versionIndex) {
    if (!draft || typeof onDraftChange !== "function") return;
    const key = sectionKey(index);
    const version = histories[key]?.[versionIndex];
    if (!version) return;
    remember(index);

    if (index === "hero") {
      onDraftChange({ ...draft, ...clone(version) });
    } else {
      const sections = [...(draft.sections || [])];
      sections[index] = clone(version);
      onDraftChange({ ...draft, sections });
    }
    setNotice("이전 버전으로 복구했습니다.");
    setTimeout(() => setNotice(""), 2200);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 99,
          padding: "12px 18px",
          borderRadius: 999,
          border: "none",
          background: "#8A6A56",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        BRAND ENGINE Tools
      </button>
    );
  }

  const tabs = [
    ["projects", "프로젝트"],
    ["strategy", "Strategy"],
    ["review", "Review"],
  ];

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 410,
          height: "80vh",
          maxHeight: "80vh",
          zIndex: 99,
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 20px 14px",
            flexShrink: 0,
            background: "#fff",
            borderBottom: "1px solid #f0ece7",
          }}
        >
          <div>
            <b style={{ fontSize: 18 }}>Service Experience</b>
            <div style={{ fontSize: 11, color: "#8B8175", marginTop: 3 }}>
              전략 확인 · 상세페이지 수정 · 검수
            </div>
          </div>
          <button
            aria-label="닫기"
            onClick={() => setOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            padding: "12px 20px",
            flexShrink: 0,
            background: "#fff",
            borderBottom: "1px solid #f0ece7",
          }}
        >
          {tabs.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: tab === value ? "#8A6A56" : "#fff",
                color: tab === value ? "white" : "#333",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {notice && (
          <div style={{ padding: "9px 20px", background: "#F4EFE9", color: "#6E533F", fontSize: 12 }}>
            {notice}
          </div>
        )}

        <div style={{ overflowY: "auto", padding: "16px 20px 24px", flex: 1, minHeight: 0 }}>
          {tab === "projects" && (
            <>
              <button onClick={refreshProjects} style={{ width: "100%", padding: 10, borderRadius: 8, cursor: "pointer" }}>
                저장 프로젝트 새로고침
              </button>
              <div style={{ margin: "12px 0", fontSize: 13 }}>저장 프로젝트 {projects.length}개</div>
              {projects.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#777" }}>저장된 프로젝트가 없습니다.</div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.projectId}
                    onClick={() => typeof onLoadProject === "function" && onLoadProject(project.projectId)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 12,
                      border: "1px solid #eee",
                      borderRadius: 10,
                      marginBottom: 8,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <b>{project.projectName}</b>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 5 }}>
                      저장일: {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ marginTop: 7, color: "#8A6A56", fontSize: 11, fontWeight: 700 }}>클릭하여 불러오기 →</div>
                  </button>
                ))
              )}
            </>
          )}

          {tab === "strategy" && (
            <div style={{ lineHeight: 1.7, fontSize: 14 }}>
              <b>AI Commerce Strategy Report</b>
              {[
                ["01 제품 분석", "카테고리와 제품 특성을 기반으로 구매자가 확인해야 하는 기준을 분석합니다."],
                ["02 구매 기준", "원료·구성·품질·사용 정보를 중심으로 선택 기준을 정리합니다."],
                ["03 Story Flow", "관심 → 신뢰 → 차별점 → 선택 이유 → 행동의 흐름으로 설계합니다."],
                ["04 디자인 전략", "제품 성격에 맞는 정보 전달 방식과 이미지 방향을 연결합니다."],
              ].map(([title, body]) => (
                <div key={title} style={{ marginTop: 10, padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
                  <b>{title}</b>
                  <p style={{ marginBottom: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "review" && (
            <div style={{ lineHeight: 1.8, fontSize: 14 }}>
              <b>Human Review</b>
              <p>AI 생성 결과를 사람이 검토하는 단계입니다.</p>
              <ul>
                <li>표현 적합성</li>
                <li>카테고리 일치</li>
                <li>과장 표현 확인</li>
                <li>구매 정보 누락 체크</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div
          onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(32,25,20,.38)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div style={{ width: "min(620px, 94vw)", maxHeight: "86vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#8A6A56", fontWeight: 800 }}>{editing.label}</div>
                <b style={{ fontSize: 19 }}>섹션 직접 수정</b>
              </div>
              <button onClick={() => setEditing(null)} style={{ fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <label style={{ display: "block", marginTop: 18, fontSize: 12, fontWeight: 800 }}>제목</label>
            <input
              value={editing.title}
              onChange={(event) => setEditing((current) => ({ ...current, title: event.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", padding: 11, marginTop: 6 }}
            />

            <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 800 }}>본문</label>
            <textarea
              value={editing.body}
              onChange={(event) => setEditing((current) => ({ ...current, body: event.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", padding: 11, marginTop: 6, minHeight: 150, resize: "vertical" }}
            />

            {editing.items !== undefined && editing.index !== "hero" && (
              <>
                <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 800 }}>목록 항목 (한 줄에 하나)</label>
                <textarea
                  value={editing.itemsText}
                  onChange={(event) => setEditing((current) => ({ ...current, itemsText: event.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", padding: 11, marginTop: 6, minHeight: 100, resize: "vertical" }}
                />
              </>
            )}

            <div style={{ marginTop: 18, padding: 12, background: "#faf7f2", borderRadius: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>✨ AI 개선 요청</label>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="예: 더 프리미엄하게, 더 간결하게, 구매 전환형으로 수정"
                style={{ width: "100%", minHeight: 70, boxSizing: "border-box", padding: 10 }}
              />
              <button
                onClick={() => { onAIImproveRequest && onAIImproveRequest(editing, feedback); }}
                style={{ marginTop: 8, padding: "8px 12px", background: "#8A6A56", color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}
              >
                ✨ AI 개선 적용
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button onClick={() => setEditing(null)} style={{ padding: "9px 14px", cursor: "pointer" }}>취소</button>
              <button onClick={saveEdit} style={{ padding: "9px 14px", background: "#8A6A56", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                수정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
