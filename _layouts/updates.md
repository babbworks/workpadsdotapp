---
layout: category
title: Company Updates
permalink: /updates
---

{% assign company_updates = site.posts | where: "category", "company updates" %}
{% for post in company_updates %}
  <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
  <p>{{ post.excerpt }}</p>
{% endfor %}
