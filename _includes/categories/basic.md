---
layout: default
nav_exclude: true
title: Basic
category: basic
---

<h1>Basic</h1>
<ul>
  {% for post in site.categories[page.category] %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
