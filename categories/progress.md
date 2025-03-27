---
layout: default
nav_exclude: true
title: Posts in "progress"
category: progress
---

<h1>Posts in "{{ page.category }}"</h1>
<ul>
  {% for post in site.categories[page.category] %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
