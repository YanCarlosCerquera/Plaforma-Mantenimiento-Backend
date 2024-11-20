import { ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import { RolService } from 'src/Segurity/rol/rol.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/Login';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly rolService: RolService,
  ) { }

  /**
   * Login Method
   */
  async login(loginDto: LoginDto): Promise<object> {
    const user = await this.userService.authentication(loginDto.document, loginDto.typeDocument);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const rolId = user.assignedRol._id.toString();
    const menu = await this.rolService.menu(rolId)

    const payload = { sub: user._id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      menu: menu
    };
  }

  async iniciarRecuperacionContrasena(typeDocument: string, numberDocument: string): Promise<void> {
    const user = await this.userService.findByDocumento(typeDocument, numberDocument);
  
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
  
    const token = this.jwtService.sign(
      { sub: user._id.toString() },
      { expiresIn: '15m' } 
    );
  
    user.tokenReference = token;
    await user.save();
  
    const urlRecuperacion = `http://localhost:3000/reset-password/${user._id}`;
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Cuenta</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #f4f4f9;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      padding: 20px;
      border: 1px solid #dddddd;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #dddddd;
    }
    .header img {
      max-width: 100px; /* Ajusta el tamaño de la imagen */
      margin-bottom: 10px;
    }
    .header h1 {
      color: #333333;
      font-size: 24px;
    }
    .content {
      margin-top: 20px;
    }
    .content p {
      color: #555555;
      margin: 10px 0;
    }
    .content a {
      display: inline-block;
      margin: 20px 0;
      padding: 10px 15px;
      background: #007bff;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .content a:hover {
      background: #0056b3;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888888;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAABIFBMVEX///85qQD//f////4qoQAqpADG47T///z9/f+936z/+/85qAH9//78/vrO47w2qgDw+ec9oQs8pwNMqCW8367+//j4//UxrACOwXW4uLj3/vJwtVePj4+n0pktnwCYmJiAgIDa2tqjo6OJiYl/vmHU68jt+uWzs7Pn5+cAAAA5mQCayoErmwChzok5oQDt/OdLoBuv3JzDw8McHBxkZGQpKSlGRkZbW1s5OTnV78ri8dRqtUdoq0mo05zT37GMvmlgrD1SqTDA46qayIrf6NTt697R372h1Yl9tlFWszGHvHByvUgxjACX2Hjl/9yRy3dlpTpywWJ7x1nR68CPvn602ZXz/eCFsGZ1pk9fn0Dt//Dx8NRqtlJ8uGXY88a31aljvlV/AAASIElEQVR4nO1da0PbuJqWZStybBklDo6pKSYUktJcnKSllwS6JGFO6aGz0DOZcmZZaP//v1hJtuRwK3QWiOH4+RAS2Un1WK/em16pAOTIkSNHjhw5cuTIkSNHjhw5cuTIkSNHjhw5cuTIkSNHjhw5/rNBIAC6Pu9e3C0cD0BQGvb3OnvFegPAKqM47z7dLYiF60s9AyHko3ZvaQDwEyMI9GDXRpTB1zSfomgDPimGBJJBD9naDFC5DufdrTsEBtOeRt1ZhpodFZ6QoMJBj2r2uTFkstocPhGGjEaw7VL3AkFbozslSObduzuA7gAwaZ+X0AThR/AU5iLGwIvolQxps2vNu3t3AJ2A/0JXM9TC/rx7dxcgDtxFV/Jjc/GPeffuTkCqI3oNQzoO5t27u4Beqlw3hFq5Me/e3QEIbETXMbSj3+bdvTsAY1i+dgyfPEPbfRJSCoLxNQxdv/I0NA3YuMZauPQznnfv7gIYLCL7SobU+Djvzt0JMAwQtS+ZRJtHF92n4JdydJB2iaGrUdR6EkLKwbyaS44ppfa4C5x5d+2OYNbDSzPRp+2CB55CfMiBwSRknGYtoaa1F+fdrTtEYDnFpu/PEKR2VHwykxDwKBiC4U6Yahs/3BmAJ5VPJDzSX1guI0R9H7Wj7UIVAvKUGMbwhoWj3Y3d1uR79anYwQtgihPGqxUYPx4zweSPY0br48uJXp1BtBIdew7hUJfUm0zmhz0sOs8AiCM7jXXsXABjpItXkjYkdzNaSRt7TukvJ7fOPIr5AMI0G2ia8V/PvLJTrKvYTL+X6lHsiRY+iDMMszJPGwvFlT2O/mK9lLQ55LeFK/CpxLh8Uh9/8+RveP+QN3gzvzyIb/30qf6wjBR0oAcLn8uGgQwOhIzQqLQaOvQ8HRzEjefRrgOvGskriH0EDh9HDFpJW1H+OPTMIQrjxtAYWt5POnJvMMFixaC+zcCXBKltuy41mvseZN1eYk0XIiVbC4eMYUV6p1QrJ8symAceHIZy4ojlbScRpW2jz1U4F+dn0qau6zKCRhSVmyGnyqIFo890K2No20lD/I6/JgzTK+NDKBmKtpQhBisGuye5F/XnshxeqlDuPFN/XBgcDoeF3Yiz0PxK1+QM4+f/z4ONFGddgJMxZE9Grjw5l8fQceAgdFmwRSMeJWt2eQiJ9+CaZxivtbjxwoMOwZd2OwzD9u9DrEuGaAnMiJdH+BgmoS8fHxouB/CylOrYCnZ8/gyi/26KoBKdOXOYiowhf77Uj5amJdZ5Xe8KHDpmyvBo9hsQYpwwZHGFkF200eUlJ+cZEuy0kM8l/sxbMsScbX/Tr7ZA9wkupVyOmJ4xytu7K/XhCTdyloNThvT0x8eiQsnBerXCr9i0st/mQk6NJQzJBYYYTJv8IfjlQ+uwzFQWm+y9wznkApim0WxXRLLURghFveW9aZUFRKmUai7ixSUxmKLRE4YarVQ7iAeLdruDobd3jiEMemISow5Tqf3Qp0JOH15KTX1SQUiGtMJm+H74tR/E1kI1S1B0niE+ELRos0/gBSldMvhNTA8RYJW+ihwdDYs39OfuwSZGaWGDhXtIdCFm4bOZ5ZAZhiiFcY5hAIMdxGckjQpg5RzDhcjn+iUaiE+FUCg0v/Lg2X/HE5HAcHL0pRIZiE8XVzzsFguR5Dz8srK/otBljyVlCDCsIGEMomE6hgSY3XJ8y5dJnTlt9cK2GEPN+Bd54KIGp3RyEgQnJQi97rC+chrZfqxbxyVyhbWITfY5hnhQZvOYqZ3RH7ZkyHzvs2QBwG5zhzBUKbrm5EH5AdBpuhFDu88Gg8UBTmlbVMu4Pl9MSq2FZ8bQgQgrUoY6BnDapPwbMpPKpRQXZS6HaWkt9n1iwlrv+GGN/sdI/NP0tMGmFyPp/RGxHrGJVSmlDJcapRkEljMzhty1nbS5N0uTYUITQIY98YlNaebpxT4fTbLlxgZ+0GBxGMVSScd/flxc7Le+hrwj1EdHOkmtRa8ygw3PiS1+wpBYATOLaSocTSzv1OVf9aMvn5cVTqPYiDI5hQ+Zu1ppC6nk+pOBVxzy0WifBamm0UTcIcC7/S8AZWwRMwTQaYVayrAIOoZ4bkZr9l86GXF1zQQ2OoYPOIgm/jYObV9oUB4GRCyAQu1R37OYC3fkS2aCou/zz/4GZgxFa7Iu6rBRXDbkrRQVhiGXCh+NG5bIaQjoVpGZfcrl4yB4yPoi7B33N8ZM3Rg8+A2NZu+0VfB4DxywFJWvwL8dqztusjfN8tdk5ZfA7o66t/3tr0hcvag2q8vJPb9/Ig/nvPH5AB1uKaaFQmGhPmgEzC8VQuTA4JyGSXBcAoQ0kiuJWnSgVU3vIKWA/2mUMJ6NCNnvyZ9wHlBKWSf484SzGlyPc4q6A6F5GTzVxOwKe4ehyj06jrrOBF98giK5MZt104G8xXkQRYOJ6L9gJNKIQKRDgUigweTKVeDNXkKNYLGsdvEG2SAZCWo8L6dAyL374M7/J9omMghiY//3lAa8f7NPQGkm6CsWF4vXY/HCxcWGtGewVJxc+JWf/dDsjT/u3wefttHfxP+kxTPBV+Pm+69Eu3DvDOuG9ndg+82iUpEYFsqX6r5vB7SQWYbowFPrMEzrHqC/w9B2s8uQNgcwXWnyYCm8VNt+G2SXoc1iqfOp631Du7o0+rEy7F1cfwiurRx+lAxttG95510uWAz/BsX7Z0hAHV1aeLnEhyuR2UkW+V8TW4/VCjHBy7Y7I6fsg0tv+mnXR9N7ZsjsYfOqxbPzECUXMx2j7cIlZwTC721/JgJmoeaNv2s8hD3US4VboPhnc3Yw0IYMezxProYTnezGmQI50BvFG393caF43zW3t45fWNwqJcul7kAWsOHivz1T+LbM+x72/LTIPezcxqmGmVn/hqVxOnf8FpZLK8EonEJFpaO0lq1Vjq3HVcbnLSsx9XuBJaW0hei4K5O7VvVrujCw7T2mjWxMX5bGsvPUKII4rMOgGvoR6qRUiqHSuZUufjwM2RQDH1W6mm7LMg0MeErbjhpQ3hcsy3SpZnQeUTktBuZhTwopbU+hbC7wnL3tbyT+m4PhIJTq1C8/qi2lzp7hU2kpdFkp5Iy45FJbWW1PB0tqJtKlxyOljvU9UZLUpc1DMb8szwErcldCpWtJN/yknLS5WlhPCqSyD0spUptG+xjy+UU8eFz2Excm2icJQwg+IsnQH3nzqQ76dcCJdKpdf1yCol6NYLykHBhaHqibVYxhU+PbozhpQXdIaSQ1pIsWYezOEDhta3JfCUXLXnLyh+N9CmN329bo+Pgx2EQ2YP1QMvRHslQW4p0ZT9UvFwGMPVTP2zaktjE6j2AIGZehmm+aUYfSyPWNmVp9zS6XLOnjDpWXzqQ3K27nT2CBJaS58VIoOvAcbioYl+54No5wKeo4PCnMRdU6ku6pjQ4wzPxUhMNmMli23zyOVSYGpKUkN0E0kGlveFiW12hzamaeYXVZxenlFZl9ggMW7Z5niD6XEoo66bftZGjpdnd+Xb8lFgwZuNtjuYxGwPmMhWCjyoA8fPLPmCFlbvpitt1Tzwq0OEXDV23ThEPhcvrKpr1DlZ2aGq7UQ+WTTJ8k4Xh7Bo0DIts+7coMsDe+vDvP9dGeKgPCy1IPURZjZBmyXoSnzgxZhM7LDy8nf23bj1RyAzaSmcjU04y/kz1AshTXcmmujTbEJhlm2K2GIcwHtV2bphlDZhS3ZdDrgJYRr2PY1N4gOLvb2upNOUS0fBg3EROrvdzUN7Y3Rk2pbF1DJRnhYU8p23YBZJZhdUeuRdDwmypHKCRVMzZz1uoe9DrKYFJVc4h5ci6Rb218klHPxgELodAo7IWOg7gUX4fBSFoPGnaYIIvYSjRRF7WAKHljsVWwo2KM8GM2GWJSqsi6OxpOhFnjYeCKKnyiY5GxgYPIlytrYd2SGYBCqIa2VwJZjKMcsJ/Ot2VHZD/jjI2MmeLcPoEs2FeJuG1Puj3emQo+oiMdeBmciw1D2jS/OZVjUP0TpRkbLKTPsboj2WYjuR3YAcNIzVfjf/XMHavoEKYypeeJlmSrNZXejGv3DqGUyGLoyla3QeJiLgg6hnTt6LYDM+a8ORAWmirubR4mnhf0pP6gftTBKtkdqIw4NTaAiBSJY5Vm5uf9l1z8IggsbdvSVBh9FVP004zNKEjXdayBXJKxmbKJNyZ6OpiolW86bmRMnxKLc4lrTunoWKxTEGI2xjPWfWbhynJahnRf6agUayUCnB1bWha0AsxMJd6gWqdwabsIzLhKkfliUhr905nNzYRYpbI67oSFUcl4wamyGH7v+OK6+HzhHUkurn2G4xQM4XGvVK/ucEZ16MxiTMqKfPkwYaiDA2X26a6nZ4YhEdkkGRyw2CAWR52wcN+Nq7RRBzjmzDcIqX5GkiI6wADHz2QonVZXy1KM4Vh42VXdPVJPvqDUDK2cmBe/NUgHkZtP0abrK+lSzbKTFWVDCJwaShx7XbmrtaTUjH1FfQEmso7d9v1R14rtCz75qmxO+6F3kVwLAvm5gckgom9QKogOUprxlFwaDgd05Vl8rmv8SGJhnelkmS/n9iUbwHAldUgrcRvB1jBu5Pspy8MrncwCipSPILMzUN+hMtPT3Ad6JrxTeNxTUUEz2c2LQVWdeElR6+rKYnwqk+PUPkjadFBIomjmQPQOMxJh7KYO6ZnqUkF6LVQrB/Bq4z1MJTJKVk2x5SU/Z7NHs5sFZeMxDyzOpNn88GPeIyZaVkkFtD5PjF4pbAS02FSNNzDSURCvUQFwLE8h5DHK/FOLmFRPY1FjitNYUvPmhxpCf/s6hUG4fKtKhXTffUfJRFrlMD844Lem8lt6x4mlwMc9mSGNS2evBMGgYMip6BtD6bsF8uwFNq/ndS5GCgJwP96C5vphP95kQHSPxb2J5BpH13/ZM4Md+SRcegbjQNGBRYOXN/LzwG5VCnbv0PmKKN8HLO0XAXU5lWzKnM6fafzvoRovFhPyI7MAMavblBPnmatMgHnRET8yIi2ccXaUuxb2ofWTaN3CLZkE8P1yYIl1YQyHhs+0T7MPshHpOxhOkW37n9UROz9m/BKPyeL13yVWQ7qntoaS1TjP1P9gvNsTKxsGX2BaptEgFkcHNHqpQ3pTgGDyvb8yd5EuZDR6fnmSrdT3oLkfJ4943JvGRWc39JLFwnhkq73AZ4GMFFeaU+caP2E+gGDYiGNyAr6rWJGWuzcVjbKocRDJzSVUJaBgMGQuajZcNgkIEgnzlu1k/YmGP278Govj9ZZcfLNZGBXv0xRZkGwRVICFtvLDbxf+6Kmy8aMVnAFP9OeYKZ0tD26VuMZW0ZDqVGt+z1yy+yI64j9CEOcRHDi3mkmEOKexnNqu6//lZcIEXg84Dn2f8qOg1BrpLTAI3fiILDs8CDKTYbsGQXHU9rlT2l75heBuCbn8GIzoYIjnc3jZLwDC0mTMhM4tVy3ntsNBSvzoKPS5DsHcj0q8FfTiCBm/sgWLwEWEPmcoQXoDmHSeLO79ikNCrODP+EiGxwHsQWvmpMvbgJge82Puq0P3AHEa6698gZg6vvWszZEjR44cOXLkyJEjR44cWYe5uvpik/19vbq6+hqAtdXVl2kg/Pq5uLYZX3v9mre9fM5veCber22KlrU59PsG8P+/g1d0s7fmm9rWW/bm+bv12kvW87e19283k9vW365vvWEf1l6Ja+vrrO3du/V3rKn2nN9Qe8Ff37/kr4RAAPl/MZ8REH26InZOmG82zTdsEJ6vC8LP3gOwVYvv2XzF2mtbnKH4zG4BrxP6guHmmw/8/ZZgiGF3b5KFUpME3j/aaIdnnsy3q+t8DFffvuVEOcOX7+J7Xr9LXtbefkgeAnixFV8TDFfX33FhjRkC/Qz9Xs9O5hRvtv2/eHfMt7W3XNae10w+OpxhLWGx9oq1rPMxfLO5ZsYMn32IZylnaH6oveO3JgzxMmpnalNwoTXkf8xXmy/FPHz/YpXPww+rW6+k5qh9WK3xDzNSCj68f7G1FjN8+e7ZS355a2t1dQ1ga9gpBlliCJNjKWubYPUZo1arcb2xVqutbqp7ntWeC11aiz/xsTJfiBtesq8wWuKrL9hX1/jhrXNg8TM44G531BEH40eR3s+RI0eOHDly5MiRI0eOHDly5MiRI0eOHDly5MiRI0eOHDly5PjPwv8B2MypYyYUcjMAAAAASUVORK5CYII=" alt="SENA Logo">
      <h1>Recuperación de Cuenta</h1>
    </div>
    <div class="content">
      <p>Cordial saludo, apreciado(a) Aprendiz <strong>${user.name}</strong>,</p>
      <p>
        El Servicio Nacional de Aprendizaje (SENA) trabaja día a día para ser una Entidad ágil, dinámica y orientada al beneficio de los ciudadanos.
      </p>
      <p>
        Hemos recibido tu solicitud de cambio de contraseña. Por favor, haz clic en el siguiente enlace para continuar con el proceso:
      </p>
      <a href="${urlRecuperacion}" target="_blank" style="
        display: block;
        margin: 20px auto;
        padding: 10px 15px;
        background: #007bff;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        text-align: center;
        width: fit-content;
      ">
        Restablecer Contraseña
      </a>
      <p>Este enlace expirará en 15 minutos.</p>
      <p>Manifestamos que nuestro compromiso es atender con oportunidad y eficacia el requerimiento que nos presentas.</p>
    </div>
    <div class="footer">
      <p>Coordinación Académica Sede Industria</p>
      <p>Neiva-Huila</p>
    </div>
  </div>
</body>
</html>
`;

    
  
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Recuperación de Contraseña',
      html: htmlContent,
    });
  }
  

 
  async resetearContrasena(userId: string, nuevaContrasena: string): Promise<void> {
    const user = await this.userService.findOne(userId);
  
    if (!user || !user.tokenReference) {
      throw new UnauthorizedException('No se encontró un proceso de recuperación válido');
    }
  
    try {
      this.jwtService.verify(user.tokenReference);
  
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
      user.password = hashedPassword;
      user.tokenReference = null;
      await user.save();
    } catch (error) {
      throw new UnauthorizedException('El token es inválido o ha expirado');
    }
  }
}  
