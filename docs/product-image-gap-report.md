# Product Image Gap Report

Date: 2026-06-03

## Result

Status: GAP_IDENTIFIED

## Summary

- CSV products: 94
- CSV image URLs present: 0
- `ProductImage` records created: 0
- Products missing images: 94

No image records were created because the CSV did not contain image URLs. No images were invented.

## Products Missing Images

1. American cheese cake (`american-cheese-cake`)
2. Americano (`americano`)
3. Avocado (`avocado`)
4. Banana (`banana`)
5. Blue ocean (`blue-ocean`)
6. Blue sky (`blue-sky`)
7. Blueberry smoothie (`blueberry-smoothie`)
8. Brownies (`brownies`)
9. Cappuccino (`cappuccino`)
10. Carmel latte (`carmel-latte`)
11. Carmel macchiato (`carmel-macchiato`)
12. Chocolate Fudge (`chocolate-fudge`)
13. Cold Brew (`cold-brew`)
14. Cortedo (`cortedo`)
15. Dragon (`dragon`)
16. Dubai cake (`dubai-cake`)
17. Espresso (`espresso`)
18. Espresso cream (`espresso-cream`)
19. Espresso Nutella (`espresso-nutella`)
20. Flat white (`flat-white`)
21. Florida (`florida`)
22. Four seasons (`four-seasons`)
23. Franch Press (`franch-press`)
24. Frappe mix Berry (`frappe-mix-berry`)
25. Frappe raspberry (`frappe-raspberry`)
26. Frappe strawberry (`frappe-strawberry`)
27. Frappe watermelon (`frappe-watermelon`)
28. Frappuccino (`frappuccino`)
29. Gauva (`gauva`)
30. Havana (`havana`)
31. Hawaii (`hawaii`)
32. Hazelnut latte (`hazelnut-latte`)
33. Herbal tea (`herbal-tea`)
34. Hibiscus ice tea (`hibiscus-ice-tea`)
35. Hot chocolate (`hot-chocolate`)
36. Hot cider (`hot-cider`)
37. Iced Americano (`iced-americano`)
38. Iced caramel latte (`iced-caramel-latte`)
39. Iced hazelnut latte (`iced-hazelnut-latte`)
40. Iced latte (`iced-latte`)
41. Iced mocha (`iced-mocha`)
42. Iced mocha frappe (`iced-mocha-frappe`)
43. Iced pistachio latte (`iced-pistachio-latte`)
44. Iced Rose latte (`iced-rose-latte`)
45. Iced Spanish latte (`iced-spanish-latte`)
46. Iced strawberry latte (`iced-strawberry-latte`)
47. Iced white mocha (`iced-white-mocha`)
48. Iced white mocha frappe (`iced-white-mocha-frappe`)
49. Latte (`latte`)
50. Lemon mint (`lemon-mint`)
51. Lemon mint smoothie (`lemon-mint-smoothie`)
52. Macchiato (`macchiato`)
53. Mango (`mango`)
54. Mango passion (`mango-passion`)
55. Mango passion smoothie (`mango-passion-1`)
56. Matcha coconut latte (`matcha-coconut-latte`)
57. Matcha mango frappe (`matcha-mango-frappe`)
58. Matcha raspberry frappe (`matcha-raspberry-frappe`)
59. Matcha strawberry frappe (`matcha-strawberry-frappe`)
60. Mocha (`mocha`)
61. Orange (`orange`)
62. Passion ice tea (`passion-ice-tea`)
63. Peach ice tea (`peach-ice-tea`)
64. Pineapple (`pineapple`)
65. pineapple ice tea (`pineapple-ice-tea`)
66. Pistachio American (`pistachio-american`)
67. Pistachio latte (`pistachio-latte`)
68. Pomegranate (`pomegranate`)
69. Raspberry smoothie (`raspberry-smoothie`)
70. Red tea (`red-tea`)
71. Red tornado (`red-tornado`)
72. Red velvet (`red-velvet`)
73. Rose latte (`rose-latte`)
74. San sabastian (`san-sabastian`)
75. Shake Carmel (`shake-carmel`)
76. Shake chocolate (`shake-chocolate`)
77. Shake Oreo (`shake-oreo`)
78. Shake pistachio (`shake-pistachio`)
79. Shake Snickers (`shake-snickers`)
80. shake Vanilla (`vanilla-shake`)
81. Spanish latte (`spanish-latte`)
82. Sparkling water (`sparkling-water`)
83. Strawberry (`strawberry`)
84. Strawberry ice tea (`strawberry-ice-tea`)
85. Strawberry smoothie (`strawberry-smoothie`)
86. Sunrise (`sunrise`)
87. Sunshine (`sunshine`)
88. Tiramisu (`tiramisu`)
89. Turkish Coffee (`turkish-coffee`)
90. V60 (`v60`)
91. Virgin mojito (`virgin-mojito`)
92. Water (`water`)
93. Watermelon (`watermelon`)
94. White mocha (`white-mocha`)

## Recommended Image Naming Structure

Use the existing `product-images` bucket.

Recommended storage path pattern:

`products/<category-slug>/<product-handle>.webp`

Examples:

- `products/hot-coffee/americano.webp`
- `products/desserts/american-cheese-cake.webp`
- `products/matcha-section/matcha-coconut-latte.webp`

## Storage Bucket Plan

1. Upload real product images to `product-images`.
2. Use the product handle as the stable filename base.
3. Create one primary `ProductImage` row per product only after a real image URL or storage path exists.
4. Do not create placeholder image records without real media.
