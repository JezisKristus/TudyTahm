using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class Permission
    {

        [Key]
        public int PermissionID { get; set; }
        public bool Delete { get; set; }
        public bool Edit { get; set; }
        public bool Read { get; set; }
        public bool Write { get; set; }
    }
}
