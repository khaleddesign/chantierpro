# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e6]
      - heading "Connexion" [level=2] [ref=e10]
      - paragraph [ref=e11]: Accédez à votre espace ChantierPro
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Email
        - textbox "Email" [disabled] [ref=e15]: invalid@example.com
      - generic [ref=e16]:
        - generic [ref=e17]: Mot de passe
        - generic [ref=e18]:
          - textbox "Mot de passe" [disabled] [ref=e19]: wrongpassword
          - button [disabled] [ref=e20]:
            - img [ref=e21]
      - button "Connexion..." [disabled]:
        - generic: Connexion...
    - paragraph [ref=e25]:
      - text: Pas encore de compte ?
      - link "Créer un compte" [ref=e26] [cursor=pointer]:
        - /url: /auth/register
  - button "Open Next.js Dev Tools" [ref=e32] [cursor=pointer]:
    - img [ref=e33] [cursor=pointer]
  - alert [ref=e36]
```