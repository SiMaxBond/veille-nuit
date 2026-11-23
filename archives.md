---
layout: default
title: Archives
permalink: /archives/
---

# Archives des rapports

{% assign rapports = site.pages | where_exp: "p", "p.path contains 'rapports/'" | sort: "path" | reverse %}
{% if rapports.size == 0 %}
Aucun rapport publié pour l'instant.
{% else %}
<ul>
{% for p in rapports %}
  {% assign jour = p.path | split: "/" | last | remove: ".md" %}
  <li><a href="{{ p.url | relative_url }}">{{ p.title }}</a> · <a href="{{ '/donnees/' | append: jour | append: '.json' | relative_url }}">JSON</a></li>
{% endfor %}
</ul>
{% endif %}
