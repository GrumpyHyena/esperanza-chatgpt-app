# Esperanza — Ticket Sales App

## Value Proposition

Buy tickets for the musical "Esperanza" by i-Majine through conversation. Target: potential audience members. Pain: having to search for the Billetweb page manually.

**Core action**: View show info and buy tickets.

## Why LLM?

**Conversational win**: "I want to see Esperanza" → instant show info and ticket access.
**LLM adds**: Natural language trigger, can answer questions about the show.
**What LLM lacks**: Ticket inventory — purchase happens on Billetweb.

## Show Details

- **Title**: Esperanza — Spectacle Musical par i-Majine
- **Venue**: La Longère de Beaupuy, Mouilleron-le-Captif
- **Dates**:
  - Jeudi 24 avril 2026 à 20h30
  - Vendredi 25 avril 2026 à 14h30
  - Vendredi 25 avril 2026 à 20h30
  - Samedi 26 avril 2026 à 14h30
- **Pricing**:
  - Moins de 12 ans : 10€
  - 12-25 ans : 14€
  - 26 ans et plus : 18€
- **Billetweb URL**: https://www.billetweb.fr/esperanza-spectacle-musical
- **Description**: Après 17 500 spectateurs et le succès du spectacle musical Hakuna Matata, i-Majine revient sur scène avec la même énergie ! Découvrez notre nouvelle création où 23 artistes bénévoles, chanteurs, danseurs et comédiens, donnent vie à une histoire originale de résistance et d'espoir. Dans le village de Solombra, rire est devenu un crime. Depuis 20 ans, le terrible gouverneur Sobé et son conseiller Etak ont banni toute forme de joie et d'émotions positives. Armés d'aspirateurs à émotions, les gardes patrouillent les rues, transformant ceux qui osent sourire en zombies sans âme. Mais l'espoir résiste. Dans l'ombre, une mystérieuse figure masquée, Esperanza, multiplie les actes de résistance contre le régime oppresseur. Et si la rébellion grondait là où on l'attend le moins ? Là où la joie est interdite, certains osent encore rêver !

## UX Flow

Buy tickets:
1. User says "I want to see Esperanza"
2. Widget shows show info: description, venue, dates, pricing
3. User selects a date
4. User clicks "Buy Tickets" → redirected to Billetweb

## Tools and Widgets

**Widget: buy_tickets**
- **Input**: `{}` (no input needed — triggered by intent)
- **Output**: `{ show }` with all show details (static data)
- **Views**: Single view — show card with date selector
- **Behavior**: User picks a date, clicks "Buy Tickets" → `openExternal` to Billetweb URL
- **CSP**: `redirectDomains: ["https://www.billetweb.fr"]`
