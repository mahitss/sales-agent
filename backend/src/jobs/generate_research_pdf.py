import os
import sys
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Cover Page Layout (Page 1)
        if self._pageNumber == 1:
            self.setFillColor(colors.HexColor("#0f172a")) # Slate dark theme accent
            self.rect(0, 500, 612, 292, fill=True, stroke=False)
            
            # Teal accent block
            self.setFillColor(colors.HexColor("#0d9488")) # Teal primary accent
            self.rect(0, 485, 612, 15, fill=True, stroke=False)
            
            # Bottom text / footer for cover page
            self.setFont("Helvetica-Bold", 10)
            self.setFillColor(colors.HexColor("#0f172a"))
            self.drawString(54, 80, "BEACON AI | ACCOUNT INTELLIGENCE")
            self.setFont("Helvetica", 9)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(54, 65, "Automated Company Analysis, Technology Stack, and Sales Playbook")
            self.drawString(54, 50, "Powered by Gemini 2.5 Flash")
            self.restoreState()
            return
            
        # Standard Page Decorations
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Running Header
        self.drawString(54, 745, "Beacon AI Account Intelligence - Corporate Briefing")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 737, 558, 737)
        
        # Running Footer
        self.line(54, 60, 558, 60)
        self.drawString(54, 45, "CONFIDENTIAL - INTERNAL SALES PREPARATION USE ONLY")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 45, page_text)
        self.restoreState()

def generate_pdf(data_json_path, output_pdf_path):
    with open(data_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=80
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0f172a")    # Slate 900
    c_secondary = colors.HexColor("#0f766e")  # Teal 700
    c_text = colors.HexColor("#334155")       # Slate 700
    c_bg_light = colors.HexColor("#f8fafc")   # Slate 50
    c_border = colors.HexColor("#e2e8f0")     # Slate 200

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=colors.white,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#94a3b8"),
        spaceAfter=30
    )
    
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceBefore=16,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_secondary,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_text,
        spaceAfter=10
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_text,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=6
    )

    email_box_style = ParagraphStyle(
        'EmailBox',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        backColor=c_bg_light,
        borderColor=c_border,
        borderWidth=0.5,
        borderPadding=10,
        spaceAfter=12
    )

    story = []
    
    domain_upper = data.get('domain', 'domain.com').upper()
    
    # ------------------ COVER PAGE ------------------
    story.append(Spacer(1, 100))
    story.append(Paragraph(f"ACCOUNT INTELLIGENCE BRIEFING", title_style))
    story.append(Paragraph(f"Target: {domain_upper}", subtitle_style))
    
    story.append(Spacer(1, 240))
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=c_primary
    )
    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_text
    )
    
    meta_table_data = [
        [Paragraph("Target Domain:", meta_label_style), Paragraph(data.get('domain', 'N/A'), meta_val_style)],
        [Paragraph("Industry Sector:", meta_label_style), Paragraph(data.get('industry', 'N/A'), meta_val_style)],
        [Paragraph("Employee Est:", meta_label_style), Paragraph(data.get('employeeEstimate', 'N/A'), meta_val_style)],
        [Paragraph("Enrichment Date:", meta_label_style), Paragraph(data.get('updatedAt', 'N/A')[:10], meta_val_style)],
    ]
    meta_table = Table(meta_table_data, colWidths=[110, 390])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(PageBreak())
    
    # ------------------ 1. EXECUTIVE SUMMARY ------------------
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(data.get('summary', 'No summary available.'), body_style))
    story.append(Spacer(1, 10))
    
    # ------------------ 2. TECH STACK & SIZE ------------------
    story.append(Paragraph("2. Profile Overview & Technology Stack", h1_style))
    
    profile_data = [
        [Paragraph("Key Metric / Segment", meta_label_style), Paragraph("Details", meta_label_style)],
        [Paragraph("Primary Industry", meta_val_style), Paragraph(data.get('industry', 'N/A'), meta_val_style)],
        [Paragraph("Employee Estimate", meta_val_style), Paragraph(data.get('employeeEstimate', 'N/A'), meta_val_style)],
        [Paragraph("Tech Stack Identified", meta_val_style), Paragraph(", ".join(data.get('techStack', []) or ['N/A']), meta_val_style)],
    ]
    profile_table = Table(profile_data, colWidths=[150, 350])
    profile_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_bg_light),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(profile_table)
    story.append(Spacer(1, 15))
    
    # ------------------ 3. CHALLENGES & OPPORTUNITIES ------------------
    story.append(Paragraph("3. Business Challenges & Opportunities", h1_style))
    
    story.append(Paragraph("Detected Challenges:", h2_style))
    for challenge in data.get('challenges', []):
        story.append(Paragraph(f"• {challenge}", bullet_style))
        
    story.append(Paragraph("Target Opportunities:", h2_style))
    for opp in data.get('opportunities', []):
        story.append(Paragraph(f"• {opp}", bullet_style))
        
    story.append(Spacer(1, 10))
    
    # ------------------ 4. BUYING SIGNALS ------------------
    story.append(Paragraph("4. Key Buying & Growth Signals", h1_style))
    for signal in data.get('buyingSignals', []):
        story.append(Paragraph(f"• {signal}", bullet_style))
        
    story.append(PageBreak())
    
    # ------------------ 5. OUTREACH STRATEGY ------------------
    story.append(Paragraph("5. Recommended Outreach Strategy", h1_style))
    story.append(Paragraph(data.get('outreachStrategy', 'No outreach strategy generated.'), body_style))
    story.append(Spacer(1, 10))
    
    # ------------------ 6. PERSONALIZED EMAIL DRAFT ------------------
    story.append(Paragraph("6. AI Personalized Email Draft", h1_style))
    email_body = data.get('emailDraft', 'No email draft available.').replace('\n', '<br/>')
    story.append(Paragraph(email_body, email_box_style))
    story.append(Spacer(1, 10))
    
    # ------------------ 7. MEETING PREP NOTES ------------------
    story.append(Paragraph("7. Meeting Preparation Notes", h1_style))
    meeting_notes_body = data.get('meetingNotes', 'No meeting preparation notes available.').replace('\n', '<br/>')
    story.append(Paragraph(meeting_notes_body, body_style))
    
    # Build
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_research_pdf.py <data_json_path> <output_pdf_path>")
        sys.exit(1)
        
    generate_pdf(sys.argv[1], sys.argv[2])
    print("PDF compiled successfully.")
