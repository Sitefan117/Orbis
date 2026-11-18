"""Build the two printable Nexus reference sheets from concise, reviewed content."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'static' / 'cours' / 'maths' / 'geometrie'
INK = colors.HexColor('#243041')
GREEN = colors.HexColor('#2e7d32')
BLUE = colors.HexColor('#1565c0')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='NTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=19, leading=23, textColor=INK, alignment=TA_LEFT, spaceAfter=8))
styles.add(ParagraphStyle(name='NHead', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=14, textColor=GREEN, spaceBefore=7, spaceAfter=3))
styles.add(ParagraphStyle(name='NBody', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.3, leading=12, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name='NSmall', parent=styles['BodyText'], fontName='Helvetica', fontSize=8.3, leading=10, textColor=INK))
styles.add(ParagraphStyle(name='NHeader', parent=styles['NSmall'], fontName='Helvetica-Bold', textColor=colors.white))

class SolidSketches(Flowable):
    def __init__(self, width):
        Flowable.__init__(self)
        self.width, self.height = width, 68

    def draw(self):
        c = self.canv
        c.setStrokeColor(BLUE)
        c.setLineWidth(1.5)
        for index, title in enumerate(('Cube', 'Pavé droit', 'Pyramide', 'Prisme')):
            x = index * self.width / 4 + 15
            if index < 2:
                w = 30 if index == 0 else 37
                c.rect(x, 22, w, 27)
                c.line(x, 49, x+12, 58); c.line(x+w, 49, x+w+12, 58)
                c.line(x+12, 58, x+w+12, 58)
                c.line(x+w+12, 58, x+w+12, 31); c.line(x+w, 22, x+w+12, 31)
            elif index == 2:
                c.line(x, 22, x+42, 22); c.line(x+42, 22, x+21, 58); c.line(x+21, 58, x, 22)
                c.line(x+21, 58, x+21, 17); c.line(x, 22, x+21, 17); c.line(x+21, 17, x+42, 22)
            else:
                c.line(x, 20, x+18, 51); c.line(x+18, 51, x+36, 20); c.line(x+36, 20, x, 20)
                c.line(x+15, 29, x+33, 60); c.line(x+33, 60, x+51, 29); c.line(x+51, 29, x+15, 29)
                c.line(x, 20, x+15, 29); c.line(x+18, 51, x+33, 60); c.line(x+36, 20, x+51, 29)
            c.setFont('Helvetica', 8)
            c.drawString(x, 5, title)

def p(text, style='NBody'):
    return Paragraph(text, styles[style])

def table(rows, widths):
    data = [[p(str(cell), 'NHeader' if index == 0 else 'NSmall') for cell in row] for index, row in enumerate(rows)]
    result = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    result.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), INK), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f8f5')]),
        ('GRID', (0, 0), (-1, -1), .4, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7), ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return result

def build(level, advanced):
    path = OUT / f'aide-memoire-{level}.pdf'
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=15*mm, rightMargin=15*mm, topMargin=13*mm, bottomMargin=13*mm)
    width = A4[0] - 30*mm
    story = [p(f'Aide mémoire de géométrie {level}', 'NTitle'), p('Nexus · Mathématiques · Espace · MSN 21'), p('Prénom : ________________________________')]
    story += [p('Les mots à connaître', 'NHead'), table([
        ('Mot', 'À retenir'), ('Côté', 'Segment du contour d’une figure plane.'),
        ('Sommet', 'Point où deux côtés ou plusieurs arêtes se rencontrent.'),
        ('Angle droit', 'Angle de 90°, vérifiable avec une équerre.'),
        ('Face', 'Surface plane d’un solide.'), ('Arête', 'Segment commun à deux faces.'),
    ], [42*mm, width-42*mm])]
    story += [p('Figures planes', 'NHead'), table([
        ('Figure', 'Propriétés essentielles'), ('Triangle', '3 côtés, 3 sommets.'),
        ('Carré', '4 côtés égaux et 4 angles droits.'),
        ('Rectangle', '4 angles droits ; côtés opposés égaux.'),
        ('Cercle', 'Contour courbe ; aucun côté droit ni sommet.'),
    ], [42*mm, width-42*mm])]
    if advanced:
        story += [p('Familles de quadrilatères 7H et 8H', 'NHead'), table([
            ('Famille', 'Propriété qui permet de la reconnaître'),
            ('Parallélogramme', 'Deux paires de côtés opposés parallèles.'),
            ('Losange', 'Quatre côtés égaux.'),
            ('Trapèze', 'Au moins une paire de côtés opposés parallèles ; vérifier la convention de classe.'),
            ('Carré', 'À la fois rectangle et losange.'),
        ], [42*mm, width-42*mm])]
    story += [p('Solides et croquis', 'NHead'), SolidSketches(width), table([
        ('Solide', 'Faces · arêtes · sommets'),
        ('Cube', '6 faces carrées · 12 arêtes · 8 sommets'),
        ('Pavé droit', '6 faces rectangulaires · 12 arêtes · 8 sommets'),
        ('Pyramide à base carrée', '5 faces · 8 arêtes · 5 sommets'),
        ('Prisme triangulaire', '5 faces · 9 arêtes · 6 sommets'),
    ], [60*mm, width-60*mm])]
    story += [p('Méthode pour reconnaître et justifier', 'NHead'),
              p('1. Décide si la figure est plane ou si c’est un solide. 2. Compte ses éléments. 3. Cherche les angles droits, les égalités et les parallèles. 4. Compare avec la définition.'),
              p('<b>Je justifie :</b> « C’est un carré parce qu’il a quatre côtés égaux et quatre angles droits. »'),
              p('<b>Attention :</b> un dessin tourné garde ses propriétés ; un carré est aussi un rectangle et un losange ; une arête appartient à un solide, un côté à une figure plane.'),
              Spacer(1, 4*mm), p('Cette fiche accompagne les manipulations, les constructions avec instruments et les discussions en classe.', 'NSmall')]
    doc.build(story)
    print(path)

if __name__ == '__main__':
    build('6H', False)
    build('7H-8H', True)
