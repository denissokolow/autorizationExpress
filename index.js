const [{ Server: h1 }, x] = [require('http'), require('express')];
const bodyParser = require('body-parser');
const session = require('express-session');
const { u: User } = require('./models/user');

const Router = x.Router();
const PORT = 4327;
const { log } = console;
const hu = { 'Content-Type': 'text/html; charset=utf-8' };
const app = x();

const checkAuth = (r, res, next) => {
  if (r.session.auth === 'ok') {
    next();
  } else {
    res.redirect('/login');
  }
};

Router
  .route('/')
  .get(r => r.res.redirect('/login'));
app
  .use((r, rs, n) => rs.status(200).set(hu) && n())
  .use(x.static('.'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(session({ secret: 'mysecret', resave: true, saveUninitialized: true }))
  .use('/', Router)
  .get('/login', r => r.res.render('login'))
  .post('/login/check/', async r => {
    const { body: { login } } = r;
    const user = await User.findOne({ login });
    if (user) {
      if (user.password === r.body.pass) {
        r.session.auth = 'ok';
        r.session.login = login;
        r.res.send('Вы	авторизованы.	Доступен	закрытый	маршрут!');
      } else {
        r.res.send('Неверный	пароль!');
      }
    } else {
      r.res.send('Нет	такого	пользователя!');
    }
  })
  .get('/users', checkAuth, async r => {
    const items = await User.find({ });
    r.res.render('list', { title: 'Список логинов', items })
    })
  .get('/logout', (r,rs) => {
        r.session.destroy( e => {
          if (e) console.log(e);
        });
        rs.send('Вы вышли из профиля') 
      })
  .use(({ res: r }) => r.status(404).set(hu).send('Пока нет!'))
  .use((e, r, rs, n) => rs.status(500).set(hu).send(`Ошибка: ${e}`))
  .set('view engine', 'pug') 
  .set('x-powered-by', false)
module.exports = h1(app)
  .listen(process.env.PORT || PORT, () => log(process.pid));
